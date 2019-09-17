import { Component, Input } from '@angular/core';
import { LocalStorage } from 'ngx-store';
import { Builder, BuildConfiguration, Round, Group, Distribution, parseDistributions, calcDistributions } from '../test2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  @LocalStorage() boys = '';
  @LocalStorage() girls = '';
  @LocalStorage() minBoys = 2;
  @LocalStorage() minGirls = 2;

  @LocalStorage() distributions: string;
  @LocalStorage() rounds = 'R1';
  @LocalStorage() iterations = 10000;
  @LocalStorage() assignHost = true;

  config: BuildConfiguration;
  builder: Builder;

  private _boysCount: number;
  private _girlsCount: number;
  private _roundsCount: number;

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

  @Input() set roundsCount(count: number) {
    this._roundsCount = count;
    this.rounds = this.setLength(this.rounds, count, 'R');
  }

  get roundsCount(): number {
    return this._roundsCount;
  }

  private setLength(value: string, count: number, prefix: string): string {
    const arr = value.split('\n');
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
    this._boysCount = this.boys.split('\n').length;
    this._girlsCount = this.girls.split('\n').length;
    this._roundsCount = this.rounds.split('\n').length;
  }

  xngOnChanges() {
    this.updateConfig();
  }


  updateConfig(): BuildConfiguration {
    const boys = this.boys.split('\n');
    const girls = this.girls.split('\n');
    const rounds = this.rounds.split('\n');
    const distributions = parseDistributions(this.distributions);
    return this.config = new BuildConfiguration(boys, girls, distributions, rounds);
  }

  calc() {
    const distributions = calcDistributions(this._boysCount, this._girlsCount, this.minBoys, this.minGirls);
    let res: string = '';
    for (let i = 0; i < distributions.length; i++) {
      res += ' ' + distributions[i].boys + ':' + distributions[i].girls;
    }
    this.distributions = res.substring(1);
  }

  run() {
    this.updateConfig();
    this.builder = new Builder();
    this.buildNextRound();
  }

  private buildNextRound() {
    if (this.builder.rounds.length < this._roundsCount) {
      setTimeout(() => {
        const round = this.builder.buildRound(this.config, this.iterations);
        if (this.assignHost) {
          this.builder.assignHosts(round);
        }
        this.buildNextRound();
      });
    }
  }

}
