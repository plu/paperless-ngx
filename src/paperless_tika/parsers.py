import os
from pathlib import Path

from django.conf import settings
from httpx import Client
from tika_client import TikaClient

from documents.parsers import DocumentParser
from documents.parsers import ParseError
from documents.parsers import make_thumbnail_from_pdf


class TikaDocumentParser(DocumentParser):
    """
    This parser sends documents to a local tika server
    """

    logging_name = "paperless.parsing.tika"

    def get_thumbnail(self, document_path, mime_type, file_name=None):
        if not self.archive_path:
            self.archive_path = self.convert_to_pdf(document_path, file_name)

        return make_thumbnail_from_pdf(
            self.archive_path,
            self.tempdir,
            self.logging_group,
        )

    def extract_metadata(self, document_path, mime_type):
        metadata_list = []
        try:
            with TikaClient(settings.TIKA_ENDPOINT) as client:
                metadata = client.metadata.from_file(document_path, mime_type)

                for key in metadata.data:
                    metadata_list.append(
                        {
                            "namespace": "",
                            "prefix": "",
                            "key": key,
                            "value": metadata.data[key],
                        },
                    )

        except Exception as e:
            self.log.warning(
                f"Error while fetching document metadata for {document_path}: {e}",
            )
        return metadata_list

    def parse(self, document_path: Path, mime_type: str, file_name=None):
        self.log.info(f"Sending {document_path} to Tika server")

        try:
            with TikaClient(settings.TIKA_ENDPOINT) as client:
                documents = client.rmeta.text.parse(document_path, mime_type)

                if documents:
                    if len(documents) > 1:
                        self.log.warning(
                            "Tika returned multiple embedded documents,"
                            " using the first",
                        )
                    document = documents[0]
                    self.text = document.content.strip()
                    self.date = document.metadata.created
                else:  # pragma: nocover
                    self.log.warning("Tika returned no parsed documents")

        except Exception as err:
            raise ParseError(
                f"Could not parse {document_path} with tika server at "
                f"{settings.TIKA_ENDPOINT}: {err}",
            ) from err

        if self.date is None:
            self.log.warning(
                f"Unable to extract date for document {document_path}",
            )

        self.archive_path = self.convert_to_pdf(document_path, mime_type)

    def convert_to_pdf(self, document_path: Path, mime_type: str):
        pdf_path = os.path.join(self.tempdir, "convert.pdf")

        gotenberg_server = settings.TIKA_GOTENBERG_ENDPOINT
        url = gotenberg_server + "/forms/libreoffice/convert"

        self.log.info(f"Converting {document_path} to PDF as {pdf_path}")
        with Client() as client:
            with document_path.open("rb") as handle:
                files = {"upload-file": (document_path.name, handle, mime_type)}

                data = {}

                # Set the output format of the resulting PDF
                # Valid inputs: https://gotenberg.dev/docs/modules/pdf-engines#uno
                if settings.OCR_OUTPUT_TYPE in {"pdfa", "pdfa-2"}:
                    data["pdfFormat"] = "PDF/A-2b"
                elif settings.OCR_OUTPUT_TYPE == "pdfa-1":
                    data["pdfFormat"] = "PDF/A-1a"
                elif settings.OCR_OUTPUT_TYPE == "pdfa-3":
                    data["pdfFormat"] = "PDF/A-3b"

                try:
                    response = client.post(url, files=files, data=data)
                    response.raise_for_status()  # ensure we notice bad responses
                except Exception as err:
                    raise ParseError(
                        f"Error while converting document to PDF: {err}",
                    ) from err

            with open(pdf_path, "wb") as file:
                file.write(response.content)
                file.close()

        return pdf_path
