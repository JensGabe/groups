import { Component, Input } from '@angular/core';
import { Builder, BuildConfiguration, Round, Group, Distribution } from '../test2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  @Input() boys = '';
  @Input() girls = '';
  @Input() minBoys = 2;
  @Input() minGirls = 2;
  _boysCount = 10;
  _girlsCount = 10;

  @Input() set boysCount(count: number) {
    this._boysCount = count;
    this.boys = this.setLength(this.boys, count, 'B');
  }

  get boysCount(): number {
    return this._boysCount;
  }

  @Input() set girlsCount(count: number) {
    this._girlsCount = count;
    this.girls = this.setLength(this.girls, count, 'G');
  }

  get girlsCount(): number {
    return this._girlsCount;
  }

  private setLength(value: string, count: number, prefix: string): string {
    let arr = value.split('\n');
    let idx: number;
    while ((idx = arr.indexOf('')) !== -1) {
      arr.splice(idx, 1);
    }
    for (let i = arr.length; i < count; i++) {
      arr.push(prefix + (i + 1));
    }
    arr.length = count;
    return arr.join('\n');
  }

  constructor() {
    this.girlsCount = 10;
    this.boysCount = 10;
  }

  xngOnChanges() {
    this.updateConfig();
  }

  @Input() rounds = 5;
  @Input() iterations = 10000;
  config: BuildConfiguration;
  builder: Builder;


  updateConfig(): BuildConfiguration {
    const boys = this.boys.split('\n');
    const girls = this.girls.split('\n');
    return this.config = new BuildConfiguration(boys, girls, this.minBoys, this.minGirls);
  }




  run() {
    this.updateConfig();
    this.builder = new Builder();
    this.buildNextRound();
  }

  private buildNextRound() {
    if (this.builder.rounds.length < this.rounds) {
      setTimeout(() => {
        this.builder.buildRound(this.config, this.iterations);
        this.buildNextRound();
      });
    }
  }

}


