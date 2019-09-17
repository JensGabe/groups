import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebStorageModule } from 'ngx-store';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    WebStorageModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
