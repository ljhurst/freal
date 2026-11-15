import { describe, expect, it } from 'vitest';
import css from '../src/app.css?raw';

/** The declarations inside the block that opens at the first match of `selector`. */
function declarations(selector: RegExp): string[] {
  const match = selector.exec(css);
  if (!match) {
    throw new Error(`no rule matches ${selector}`);
  }
  const open = css.indexOf('{', match.index);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') {
      depth += 1;
    } else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  return css
    .slice(open + 1, end)
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .sort();
}

const names = (block: string[]) => block.map((declaration) => declaration.split(':')[0]).sort();

const DARK = /^:root\s*\{/m;
const LIGHT_FROM_OS = /:root:where\(:not\(\[data-theme=["']dark["']\]\)\)\s*\{/;
const LIGHT_PINNED = /^:root\[data-theme=["']light["']\]\s*\{/m;

describe('theme tokens', () => {
  it('give the light theme the same values whether it comes from the OS or the toggle', () => {
    const fromOs = declarations(LIGHT_FROM_OS);

    expect(fromOs.length).toBeGreaterThan(10);
    expect(declarations(LIGHT_PINNED)).toEqual(fromOs);
  });

  it('define every dark token in the light theme too', () => {
    const dark = names(declarations(DARK)).filter((name) => name !== 'color-scheme');
    const light = names(declarations(LIGHT_PINNED)).filter((name) => name !== 'color-scheme');

    expect(light).toEqual(dark);
  });
});
