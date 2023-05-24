import {
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing'
import { StatisticsWidgetComponent } from './statistics-widget.component'
import { ComponentFixture } from '@angular/core/testing'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { WidgetFrameComponent } from '../widget-frame/widget-frame.component'
import { environment } from 'src/environments/environment'

describe('StatisticsWidgetComponent', () => {
  let component: StatisticsWidgetComponent
  let fixture: ComponentFixture<StatisticsWidgetComponent>
  let httpTestingController: HttpTestingController

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [StatisticsWidgetComponent, WidgetFrameComponent],
      imports: [HttpClientTestingModule, NgbModule],
    }).compileComponents()

    fixture = TestBed.createComponent(StatisticsWidgetComponent)
    component = fixture.componentInstance

    httpTestingController = TestBed.inject(HttpTestingController)

    fixture.detectChanges()
  })

  it('should call api statistics endpoint', fakeAsync(() => {
    const req = httpTestingController.expectOne(
      `${environment.apiBaseUrl}statistics/`
    )
    expect(req.request.method).toEqual('GET')
  }))

  it('should display inbox link with count', fakeAsync(() => {
    const mockStats = {
      documents_total: 200,
      documents_inbox: 18,
      inbox_tag: 10,
    }

    const req = httpTestingController.expectOne(
      `${environment.apiBaseUrl}statistics/`
    )

    req.flush(mockStats)
    fixture.detectChanges()

    const goToInboxSpy = jest.spyOn(component, 'goToInbox')

    expect(fixture.nativeElement.textContent.replace(/\s/g, '')).toContain(
      'inbox:18'
    )
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement
    expect(link).not.toBeNull()
    link.click()
    expect(goToInboxSpy).toHaveBeenCalled()
  }))

  it('should display mime types with counts', fakeAsync(() => {
    const mockStats = {
      documents_total: 200,
      documents_inbox: 18,
      inbox_tag: 10,
      document_file_type_counts: [
        {
          mime_type: 'application/pdf',
          mime_type_count: 160,
        },
        {
          mime_type: 'text/plain',
          mime_type_count: 20,
        },
        {
          mime_type: 'text/csv',
          mime_type_count: 20,
        },
      ],
      character_count: 162312,
    }

    const req = httpTestingController.expectOne(
      `${environment.apiBaseUrl}statistics/`
    )

    req.flush(mockStats)
    fixture.detectChanges()

    expect(fixture.nativeElement.textContent.replace(/\s/g, '')).toContain(
      'PDF(80%)'
    )
    expect(fixture.nativeElement.textContent.replace(/\s/g, '')).toContain(
      'TXT(10%)'
    )
    expect(fixture.nativeElement.textContent.replace(/\s/g, '')).toContain(
      'CSV(10%)'
    )
  }))
})
