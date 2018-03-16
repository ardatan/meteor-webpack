import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        BrowserModule.withServerTransition({
            appId: 'meteor-angular'
        }),
        FormsModule
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }