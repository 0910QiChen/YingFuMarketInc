import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LocalizedPipe } from '../i18n/localized.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslateModule, LocalizedPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})

export class SidebarComponent {
  @Input() categories: { name: string; count: number }[] = [];
  @Input() selected = '';
  @Output() selectCategory = new EventEmitter<string>();
  constructor() {}

  onSelect(name: string) {
    this.selectCategory.emit(name);
  }
}
