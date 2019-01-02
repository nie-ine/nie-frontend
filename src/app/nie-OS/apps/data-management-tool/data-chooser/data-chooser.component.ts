import {
  Component,
  OnInit,
  Inject,
  AfterViewChecked,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatFormField} from '@angular/material';
import {DataChooserSettingsComponent} from "../data-chooser-settings/data-chooser-settings.component";
import {SendGravSearchQueryService} from "../../../../shared/knora/gravsearch/sendGravSearchQuery.service";

@Component({
  selector: 'app-data-chooser',
  templateUrl: './data-chooser.component.html',
  styleUrls: ['./data-chooser.component.scss']
})
export class DataChooserComponent implements AfterViewChecked {
  @Input() openAppsInThisPage;
  @Input() dataChooserEntries = [];
  @Input() response;
  @Input() queryId;
  @Output() sendAppTypesBackToNIEOS: EventEmitter<any> = new EventEmitter<any>();
  @Input() appInputQueryMapping;
  gravSearchString: string;
  dataChooserString: string;
  gravSearchResponse: Array<any>;
  chosenPropertyArray: Array<any>;
  dataChooserSettingsOutput: any;
  responseTest: any;
  index: number;
  constructor(
    public dialogSettings: MatDialog,
    private cdr: ChangeDetectorRef,
  ) { }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }
  chooseResource(index: number) {
    // console.log(
    //   this.openAppsInThisPage,
    //   this.queryId,
    //   this.appInputQueryMapping
    // );
    this.index = index;
      for ( const type in this.openAppsInThisPage ) {
        if(  this.openAppsInThisPage[ type ].model.length && type !== 'dataChooser' ) {
          for ( const app of this.openAppsInThisPage[ type ].model ) {
            if( this.appInputQueryMapping[ app.hash ] ) {
              for ( const input in this.appInputQueryMapping[ app.hash ] ) {
                if( this.appInputQueryMapping[ app.hash ][ input ][ 'query' ] === this.queryId ) {
                  // console.log( this.appInputQueryMapping[ app.hash ], app );
                  app[ input ] = this.generateAppinput(
                    this.response,
                    this.appInputQueryMapping[ app.hash ][ input ][ 'path' ],
                    index,
                    0
                  );
                  // console.log( app );
                }
              }
            }
          }
        }
    }
    this.sendAppTypesBackToNIEOS.emit(this.openAppsInThisPage );
  }
  generateAppinput( response: any, path: any, index: number, depth: number) {
    // console.log(
    //   // response,
    //   depth,
    //   path.length,
    //   path[ depth ],
    //   Number( path[ depth ] ),
    //   index
    // );
    if ( response.length ) {
      // console.log( 'Use index' );
      return this.generateAppinput(
        response[ index ], path, index, depth + 1
      );
    } else if ( depth !== path.length && response[ path[ depth ] ] ) {
      // console.log( 'One depth more', path, depth );
      return this.generateAppinput(
        response[ path[ depth ] ], path, index, depth + 1
      );
    } else if ( depth === path.length ) {
      // console.log( path, depth, response );
      // console.log( 'Return', response[ path[ depth - 1 ] ] );
      return response[ path[ depth - 1 ] ];
    } else if ( path.length - 1 === depth &&  Number( path[ depth ] ) ) {
      // console.log( 'Return index from array:', response[ path[ depth - 1 ] ][ Number( path[ depth ] ) ] );
      return response[ path[ depth - 1 ] ][ Number( path[ depth ] ) ];
    }
  }

  moveBack() {
    // console.log('move back');
    this.index -= 1;
    this.chooseResource( this.index );
  }

  moveForward() {
    // console.log('move forward');
    this.index += 1;
    this.chooseResource( this.index );
  }

  showChosenEnrty( entry: string) {
    // console.log( entry, this.index );
    if( !this.index ) {
      return entry;
    }
    return this.dataChooserEntries[this.index];
  }

  resetDataChooserEntries() {
    this.index = undefined;
  }
}
