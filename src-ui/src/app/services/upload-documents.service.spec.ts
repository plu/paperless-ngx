import { TestBed } from '@angular/core/testing'
import { UploadDocumentsService } from './upload-documents.service'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { environment } from 'src/environments/environment'
import { FileSystemFileEntry } from 'ngx-file-drop'

describe('UploadDocumentsService', () => {
  let httpTestingController: HttpTestingController
  let uploadDocumentsService: UploadDocumentsService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UploadDocumentsService],
      imports: [HttpClientTestingModule],
    })

    httpTestingController = TestBed.inject(HttpTestingController)
    uploadDocumentsService = TestBed.inject(UploadDocumentsService)
  })

  afterEach(() => {
    httpTestingController.verify()
  })

  it('calls post_document api endpoint on upload', () => {
    const fileEntry = {
      name: 'file.pdf',
      isDirectory: false,
      isFile: true,
      file: (callback) => {
        return callback(
          new File(
            [new Blob(['testing'], { type: 'application/pdf' })],
            'file.pdf'
          )
        )
      },
    }
    uploadDocumentsService.uploadFiles([
      {
        relativePath: 'path/to/file.pdf',
        fileEntry,
      },
    ])
    const req = httpTestingController.expectOne(
      `${environment.apiBaseUrl}documents/post_document/`
    )
    expect(req.request.method).toEqual('POST')

    req.flush('123-456')
  })
})
