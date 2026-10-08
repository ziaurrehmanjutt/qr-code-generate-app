import { GradientEditorComponent } from '../tab2/gradient-editor/gradient-editor.component';
import { GradientConfig, QrService, SUPPORTED_OPTIONS, gradientCss } from './qr.service';

describe('Gradients', () => {
  const three: GradientConfig = {
    type: 'linear',
    rotation: 90,
    stops: [{ offset: 1, color: '#0000ff' }, { offset: 0, color: '#ff0000' }, { offset: 0.5, color: '#00ff00' }],
  };

  it('passes every color stop to the library, sorted, with the rotation in radians', () => {
    const qr = new QrService();
    qr.config.dotsGradient = three;
    const gradient = qr.buildOptions().dotsOptions.gradient;
    expect(gradient.type).toBe('linear');
    expect(gradient.rotation).toBeCloseTo(Math.PI / 2, 5);
    expect(gradient.colorStops.map((s: any) => s.color)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
  });

  it('adds no gradient for solid colors', () => {
    const qr = new QrService();
    expect(qr.buildOptions().dotsOptions.gradient).toBeUndefined();
  });

  it('converts a code saved with the old two-color gradient fields', () => {
    const qr = new QrService();
    qr.loadConfig({
      dotsGradientType: 'linear', dotsGradientColor1: '#111111', dotsGradientColor2: '#222222', dotsGradientRotation: 45,
    } as any);
    const g = qr.config.dotsGradient;
    expect(g.type).toBe('linear');
    expect(g.rotation).toBe(45);
    expect(g.stops.map((s) => s.color)).toEqual(['#111111', '#222222']);
    expect((qr.config as any).dotsGradientType).toBeUndefined();
  });

  it('builds preview CSS', () => {
    expect(gradientCss('#123456', { type: 'none', rotation: 0, stops: [] })).toBe('#123456');
    expect(gradientCss('#000', { ...three, rotation: 0 })).toContain('linear-gradient(90deg, #ff0000 0%');
  });

  it('applies every preset without leaving the config unusable', () => {
    const qr = new QrService();
    for (const preset of SUPPORTED_OPTIONS.presets) {
      Object.assign(qr.config, preset.patch);
      const options = qr.buildOptions();
      expect(options.dotsOptions.type).toBeTruthy();
    }
  });
});

describe('GradientEditorComponent', () => {
  const create = (type: GradientConfig['type'] = 'linear') => {
    const editor = new GradientEditorComponent();
    editor.solid = '#000000';
    editor.gradient = { type, rotation: 0, stops: [{ offset: 0, color: '#111111' }, { offset: 1, color: '#222222' }] };
    const emitted: GradientConfig[] = [];
    editor.gradientChange.subscribe((g) => emitted.push(g));
    return { editor, emitted };
  };

  it('adds a color in the middle, up to five', () => {
    const { editor, emitted } = create();
    editor.addStop();
    expect(emitted[0].stops.length).toBe(3);
    expect(emitted[0].stops.map((s) => s.offset)).toEqual([0, 0.5, 1]);
    editor.gradient = { ...editor.gradient, stops: Array.from({ length: 5 }, (_, i) => ({ offset: i / 4, color: '#000' })) };
    editor.addStop();
    expect(emitted.length).toBe(1);
  });

  it('never removes below two colors', () => {
    const { editor, emitted } = create();
    editor.removeStop(0);
    expect(emitted.length).toBe(0);
  });

  it('reverses the colors', () => {
    const { editor, emitted } = create();
    editor.reverse();
    expect(emitted[0].stops.map((s) => s.offset)).toEqual([1, 0]);
  });

  it('starts a gradient from the current solid color', () => {
    const { editor, emitted } = create('none');
    editor.solid = '#abcdef';
    editor.setType('radial');
    expect(emitted[0].type).toBe('radial');
    expect(emitted[0].stops[0].color).toBe('#abcdef');
  });
});

describe('Styles offered in the app', () => {
  it('lists every shape the library supports', () => {
    expect(SUPPORTED_OPTIONS.cornerStyles.length).toBe(7);
    expect(SUPPORTED_OPTIONS.cornerDotStyles.length).toBe(7);
    expect(SUPPORTED_OPTIONS.dotStyles.length).toBe(6);
  });

  it('draws a code for every corner frame and corner dot style', async () => {
    for (const [key, list] of [['cornersSquareType', SUPPORTED_OPTIONS.cornerStyles], ['cornersDotType', SUPPORTED_OPTIONS.cornerDotStyles]] as const) {
      for (const style of list) {
        const qr = new QrService();
        (qr.config as any)[key] = style.value;
        const holder = document.createElement('div');
        document.body.appendChild(holder);
        qr.createQrCode().append(holder);
        await new Promise((resolve) => setTimeout(resolve, 60));
        const canvas = holder.querySelector('canvas') as HTMLCanvasElement;
        const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
        expect(data.some((v, i) => i % 4 === 0 && v < 100 && data[i + 3] > 200)).withContext(`${key}=${style.value}`).toBeTrue();
        holder.remove();
      }
    }
  });
});
