import {ScaleChannel} from '../channel';
import {CellConfig, Config} from '../config';
import {Repeat} from '../repeat';
import {initConcatResolve, ResolveMapping} from '../resolve';
import {ConcatSpec, isVConcatSpec, RepeatSpec} from '../spec';
import {Dict, keys, vals} from '../util';
import {VgData, VgLayout, VgScale, VgSignal} from '../vega.schema';
import {buildModel} from './common';
import {assembleData} from './data/assemble';
import {parseData} from './data/parse';
import {moveSharedLegendUp} from './legend/parse';
import {Model} from './model';
import {RepeaterValue} from './repeat';
import {moveSharedScaleUp} from './scale/parse';


export class ConcatModel extends Model {

  public readonly children: Model[];

  public readonly isVConcat: boolean;

  private readonly resolve: ResolveMapping;

  constructor(spec: ConcatSpec, parent: Model, parentGivenName: string, repeater: RepeaterValue, config: Config) {
    super(spec, parent, parentGivenName, config);

    this.resolve = initConcatResolve(spec.resolve || {});

    this.isVConcat = isVConcatSpec(spec);

    this.children = (isVConcatSpec(spec) ? spec.vconcat : spec.hconcat).map((child, i) => {
      return buildModel(child, this, this.getName('concat_' + i), undefined, repeater, config);
    });
  }

  public parseData() {
    this.component.data = parseData(this);
    this.children.forEach((child) => {
      child.parseData();
    });
  }

  public parseSelection() {
    // Merge selections up the hierarchy so that they may be referenced
    // across unit specs. Persist their definitions within each child
    // to assemble signals which remain within output Vega unit groups.
    this.component.selection = {};
    for (const child of this.children) {
      child.parseSelection();
      keys(child.component.selection).forEach((key) => {
        this.component.selection[key] = child.component.selection[key];
      });
    }
  }

  public parseScale() {
    const model = this;

    const scaleComponent: Dict<VgScale> = this.component.scales = {};

    for (const child of this.children) {
      child.parseScale();

      keys(child.component.scales).forEach((channel: ScaleChannel) => {
        if (this.resolve[channel].scale === 'shared') {
          moveSharedScaleUp(this, scaleComponent, child, channel);
        }
      });
    }
  }

  public parseMark() {
    for (const child of this.children) {
      child.parseMark();
    }
  }

  public parseAxisAndHeader() {
    for (const child of this.children) {
      child.parseAxisAndHeader();
    }

    // TODO(#2415): support shared axes
  }

  public parseAxisGroup(): void {
    return null;
  }

  public parseLegend() {
    const legendComponent = this.component.legends = {};

    for (const child of this.children) {
      child.parseLegend();

      keys(child.component.legends).forEach((channel: ScaleChannel) => {
        if (this.resolve[channel].legend === 'shared') {
          moveSharedLegendUp(legendComponent, child, channel);
        }
      });
    }
  }

  public assembleData(): VgData[] {
     if (!this.parent) {
      // only assemble data in the root
      return assembleData(this.component.data);
    }

    return [];
  }

  public assembleParentGroupProperties(): any {
    return null;
  }

  public assembleSelectionTopLevelSignals(signals: any[]): VgSignal[] {
    return this.children.reduce((sg, child) => child.assembleSelectionTopLevelSignals(sg), signals);
  }

  public assembleSelectionSignals(): VgSignal[] {
    this.children.forEach((child) => child.assembleSelectionSignals());
    return [];
  }

  public assembleLayoutSignals(): VgSignal[] {
    return this.children.reduce((signals, child) => {
      return signals.concat(child.assembleLayoutSignals());
    }, []);
  }
  public assembleSelectionData(data: VgData[]): VgData[] {
    return this.children.reduce((db, child) => child.assembleSelectionData(db), []);
  }

  public assembleScales(): VgScale[] {
    // combine with scales from children
    return this.children.reduce((scales, c) => {
      return scales.concat(c.assembleScales());
    }, super.assembleScales());
  }

  public assembleLayout(): VgLayout {
    // TODO: allow customization
    return {
      padding: {row: 10, column: 10},
      offset: 10,
      ...(this.isVConcat ? {columns: 1} : {}),
      bounds: 'full',
      align: 'all'
    };
  }

  public assembleMarks(): any[] {
    // only children have marks
    return this.children.map(child => {
      const encodeEntry = child.assembleParentGroupProperties();
      return {
        type: 'group',
        name: child.getName('group'),
        ...(encodeEntry ? {
          encode: {
            update: encodeEntry
          }
        } : {}),
        ...child.assembleGroup()
      };
    });
  }
}
