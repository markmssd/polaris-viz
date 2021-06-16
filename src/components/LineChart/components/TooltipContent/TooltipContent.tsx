import React from 'react';
import type {LineStyle, SeriesColor} from 'types';

import {LinePreview} from '../../../LinePreview';

import styles from './TooltipContent.scss';

interface TooltipData {
  name: string;
  point: {
    label: string;
    value: string;
  };
  color: SeriesColor;
  lineStyle: LineStyle;
}

export interface TooltipContentProps {
  data: TooltipData[];
}

export function TooltipContent({data}: TooltipContentProps) {
  return (
    <div className={styles.Container}>
      {data.map(({name, point: {label, value}, color, lineStyle}, index) => {
        return (
          <React.Fragment key={`${name}-${index}`}>
            <LinePreview color={color} lineStyle={lineStyle} />
            <p className={styles.Name}>{label}</p>
            <p className={styles.Value}>{value}</p>
          </React.Fragment>
        );
      })}
    </div>
  );
}
