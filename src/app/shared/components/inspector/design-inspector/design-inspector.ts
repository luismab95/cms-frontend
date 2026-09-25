import { Component, effect, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'design-inspector-component',
  templateUrl: './design-inspector.html',
  imports: [FormsModule, EditorComponent],
})
export class DesignInspectorComponent implements OnInit {
  css = input<string>('');
  editorOptions = {
    theme: 'vs-dark',
    language: 'css',
    minimap: { enabled: false },
  };
  code = '';

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      {
        const css = this.css();
        this.code = css;
      }
    });
  }

  /**
   * On Init
   */
  ngOnInit(): void {}
}
