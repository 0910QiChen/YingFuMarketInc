import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about-story',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about-story.component.html',
  styleUrl: './about-story.component.css',
})
export class AboutStoryComponent {}
