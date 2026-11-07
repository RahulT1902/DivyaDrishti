import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

export interface ChartToken {
  house: number;     // 1–12, counted from the ascendant
  label: string;     // e.g. "Su", "Sa℞"
  color: string;
}

// Planet-token anchor, sign-number anchor and tokens per line for each house of
// the 400×400 North Indian diamond (house 1 = top centre, counter-clockwise).
const LAYOUT: Record<number, { x: number; y: number; sx: number; sy: number; perLine: number }> = {
  1:  { x: 200, y: 92,  sx: 200, sy: 178, perLine: 3 },
  2:  { x: 100, y: 28,  sx: 100, sy: 82,  perLine: 3 },
  3:  { x: 30,  y: 88,  sx: 80,  sy: 104, perLine: 1 },
  4:  { x: 100, y: 192, sx: 178, sy: 205, perLine: 3 },
  5:  { x: 30,  y: 288, sx: 80,  sy: 304, perLine: 1 },
  6:  { x: 100, y: 362, sx: 100, sy: 326, perLine: 3 },
  7:  { x: 200, y: 296, sx: 200, sy: 232, perLine: 3 },
  8:  { x: 300, y: 362, sx: 300, sy: 326, perLine: 3 },
  9:  { x: 370, y: 288, sx: 320, sy: 304, perLine: 1 },
  10: { x: 300, y: 192, sx: 222, sy: 205, perLine: 3 },
  11: { x: 370, y: 88,  sx: 320, sy: 104, perLine: 1 },
  12: { x: 300, y: 28,  sx: 300, sy: 82,  perLine: 3 },
};

const KENDRA = ['200,200 100,100 200,0 300,100', '200,200 100,300 200,400 300,300',
  '200,200 100,100 0,200 100,300', '200,200 300,100 400,200 300,300'];
const TRIANGLES = ['0,0 200,0 100,100', '0,0 0,200 100,100', '0,400 0,200 100,300', '0,400 200,400 100,300',
  '400,400 200,400 300,300', '400,400 400,200 300,300', '400,0 400,200 300,100', '400,0 200,0 300,100'];

export default function NorthIndianChart({ lagnaSign, tokens, size = 320 }: {
  lagnaSign: number; tokens: ChartToken[]; size?: number;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 400 400">
        {KENDRA.map(p => <Polygon key={p} points={p} fill="#FDFBF7" />)}
        {TRIANGLES.map(p => <Polygon key={p} points={p} fill="#FAF6EA" />)}
        <Rect x="1" y="1" width="398" height="398" fill="none" stroke="#C5B495" strokeWidth="2.5" />
        <Line x1="0" y1="0" x2="400" y2="400" stroke="#C5B495" strokeWidth="1.5" />
        <Line x1="400" y1="0" x2="0" y2="400" stroke="#C5B495" strokeWidth="1.5" />
        <Line x1="200" y1="0" x2="0" y2="200" stroke="#C5B495" strokeWidth="2" />
        <Line x1="0" y1="200" x2="200" y2="400" stroke="#C5B495" strokeWidth="2" />
        <Line x1="200" y1="400" x2="400" y2="200" stroke="#C5B495" strokeWidth="2" />
        <Line x1="400" y1="200" x2="200" y2="0" stroke="#C5B495" strokeWidth="2" />

        {Object.entries(LAYOUT).map(([h, pos]) => {
          const house = Number(h);
          const signNum = ((lagnaSign + house - 2) % 12) + 1;
          const inHouse = tokens.filter(t => t.house === house);
          const lines: ChartToken[][] = [];
          for (let i = 0; i < inHouse.length; i += pos.perLine) lines.push(inHouse.slice(i, i + pos.perLine));
          const lineHeight = 22;
          const top = pos.y - ((lines.length - 1) * lineHeight) / 2;
          return (
            <React.Fragment key={house}>
              <SvgText x={pos.sx} y={pos.sy} fontSize="13" fontWeight="bold" fill="#B45309" textAnchor="middle">
                {signNum}
              </SvgText>
              {lines.map((line, li) => {
                const spacing = 38;
                const left = pos.x - ((line.length - 1) * spacing) / 2;
                return line.map((t, ti) => (
                  <SvgText
                    key={`${li}-${ti}`}
                    x={left + ti * spacing}
                    y={top + li * lineHeight + 6}
                    fontSize="16"
                    fontWeight="bold"
                    fill={t.color}
                    textAnchor="middle"
                  >
                    {t.label}
                  </SvgText>
                ));
              })}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export const PLANET_COLORS: Record<string, string> = {
  Lagna: '#D97706', Sun: '#B45309', Moon: '#1D4ED8', Mars: '#B91C1C', Mercury: '#047857',
  Jupiter: '#A16207', Venus: '#BE185D', Saturn: '#1E293B', Rahu: '#3F3F46', Ketu: '#3F3F46',
};
