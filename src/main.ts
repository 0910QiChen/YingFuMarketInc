import { bootstrapApplication } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const injector = appRef.injector;
    const documentRef = injector.get(DOCUMENT);
    const titleService = injector.get(Title);
    const translate = injector.get(TranslateService);

    translate.stream('document.title').subscribe((translatedTitle: string) => {
      titleService.setTitle(translatedTitle);
    });

    translate.onLangChange.subscribe(({ lang }) => {
      documentRef.documentElement.lang = lang;
    });

    documentRef.documentElement.lang = translate.currentLang || translate.getDefaultLang() || 'zh';
  })
  .catch((err) => console.error(err));
