import {Fragment, useState} from 'react';
import {pie} from 'd3-shape';
import {
  clamp,
  useTheme,
  COLOR_VISION_SINGLE_ITEM,
  useUniqueId,
  ChartState,
  useChartContext,
  THIN_ARC_CORNER_THICKNESS,
} from '@shopify/polaris-viz-core';
import type {
  DataPoint,
  DataSeries,
  Dimensions,
  LabelFormatter,
  Direction,
} from '@shopify/polaris-viz-core';

import {getAnimationDelayForItems} from '../../utilities/getAnimationDelayForItems';
import {getContainerAlignmentForLegend} from '../../utilities';
import type {ComparisonMetricProps} from '../ComparisonMetric';
import {LegendContainer, useLegend} from '../../components/LegendContainer';
import {
  getSeriesColors,
  useColorVisionEvents,
  useWatchColorVisionEvents,
} from '../../hooks';
import {Arc} from '../Arc';
import type {
  ColorVisionInteractionMethods,
  LegendPosition,
  RenderHiddenLegendLabel,
  RenderInnerValueContent,
  RenderLegendContent,
} from '../../types';
import {ChartSkeleton} from '../../components/ChartSkeleton';

import styles from './DonutChart.scss';
import {InnerValue, LegendValues} from './components';

const FULL_CIRCLE = Math.PI * 2;
const RADIUS_PADDING = 20;
const SMALL_CHART_HEIGHT_THRESHOLD = 150;

export interface ChartProps {
  data: DataSeries[];
  labelFormatter: LabelFormatter;
  legendPosition: LegendPosition;
  seriesNameFormatter: LabelFormatter;
  showLegend: boolean;
  showLegendValues: boolean;
  state: ChartState;
  theme: string;
  accessibilityLabel?: string;
  comparisonMetric?: ComparisonMetricProps;
  dimensions?: Dimensions;
  errorText?: string;
  legendFullWidth?: boolean;
  renderInnerValueContent?: RenderInnerValueContent;
  renderLegendContent?: RenderLegendContent;
  renderHiddenLegendLabel?: RenderHiddenLegendLabel;
  total?: number;
}

export function Chart({
  data,
  labelFormatter,
  legendPosition = 'right',
  showLegend,
  showLegendValues,
  state,
  theme,
  accessibilityLabel = '',
  comparisonMetric,
  dimensions = {height: 0, width: 0},
  errorText,
  legendFullWidth = false,
  renderInnerValueContent,
  renderLegendContent,
  renderHiddenLegendLabel,
  seriesNameFormatter,
  total,
}: ChartProps) {
  const {shouldAnimate} = useChartContext();
  const chartId = useUniqueId('Donut');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const selectedTheme = useTheme();

  const seriesCount = clamp({
    amount: data.length,
    min: 1,
    max: Infinity,
  });

  const seriesColor = getSeriesColors(seriesCount, selectedTheme);

  const legendDirection: Direction =
    legendPosition === 'right' || legendPosition === 'left'
      ? 'vertical'
      : 'horizontal';

  const maxLegendWidth =
    legendDirection === 'vertical' ? dimensions.width / 2 : 0;

  const {height, width, legend, setLegendDimensions, isLegendMounted} =
    useLegend({
      data: [{series: data, shape: 'Bar'}],
      dimensions,
      showLegend,
      direction: legendDirection,
      colors: seriesColor,
      maxWidth: maxLegendWidth,
      seriesNameFormatter,
    });

  const shouldUseColorVisionEvents = Boolean(
    width && height && isLegendMounted,
  );

  useColorVisionEvents({
    enabled: shouldUseColorVisionEvents,
    dimensions: {...dimensions, x: 0, y: 0},
  });

  useWatchColorVisionEvents({
    type: COLOR_VISION_SINGLE_ITEM,
    onIndexChange: ({detail}) => {
      setActiveIndex(detail.index);
    },
  });

  if (!width || !height) {
    return null;
  }

  const diameter = Math.min(height, width);
  const radius = diameter / 2;
  const dynamicThickness = height / 10;
  const maxThickness = selectedTheme.arc.thickness;
  const thickness =
    height > SMALL_CHART_HEIGHT_THRESHOLD
      ? Math.min(dynamicThickness, maxThickness)
      : THIN_ARC_CORNER_THICKNESS;

  const points: DataPoint[] = data.reduce(
    (prev: DataPoint[], {data}) => prev.concat(data),
    [],
  );

  const createPie = pie<DataPoint>()
    .value(({value}) => value!)
    .sort(null);
  const pieChartData = createPie(points);
  const isEveryValueZero = points.every(({value}) => value === 0);
  const emptyState = pieChartData.length === 0 || isEveryValueZero;

  const totalValue =
    total || points.reduce((acc, {value}) => (value ?? 0) + acc, 0);

  const activeValue = points[activeIndex]?.value;

  const minX = -40;
  const minY = -40;
  const viewBoxDimensions = {
    height: diameter + RADIUS_PADDING,
    width: diameter + RADIUS_PADDING,
  };

  const containerAlignmentStyle =
    getContainerAlignmentForLegend(legendPosition);

  const dynamicStyles = {
    ...containerAlignmentStyle,
    gap: legendDirection === 'vertical' ? '16px' : undefined,
  };

  const renderLegendContentWithValues = ({
    getColorVisionStyles,
    getColorVisionEventAttrs,
  }: ColorVisionInteractionMethods) => {
    return (
      <LegendValues
        data={data}
        activeIndex={activeIndex}
        dimensions={{...dimensions, x: 0, y: 0}}
        legendFullWidth={legendFullWidth}
        labelFormatter={labelFormatter}
        getColorVisionStyles={getColorVisionStyles}
        getColorVisionEventAttrs={getColorVisionEventAttrs}
        renderHiddenLegendLabel={renderHiddenLegendLabel}
        seriesNameFormatter={seriesNameFormatter}
      />
    );
  };

  const shouldRenderLegendContentWithValues =
    !renderLegendContent && showLegendValues && legendDirection === 'vertical';

  const isCornerPosition = legendPosition.includes('-');

  return (
    <div className={styles.DonutWrapper} style={dynamicStyles}>
      <div className={styles.Donut}>
        {state === ChartState.Success ? (
          <Fragment>
            <span className={styles.VisuallyHidden}>{accessibilityLabel}</span>
            <svg
              viewBox={`${minX} ${minY} ${viewBoxDimensions.width} ${viewBoxDimensions.height}`}
              height={diameter}
              width={diameter}
            >
              {isLegendMounted && (
                <g className={styles.DonutChart}>
                  {emptyState ? (
                    <g aria-hidden>
                      <Arc
                        isAnimated={shouldAnimate}
                        width={diameter}
                        height={diameter}
                        radius={radius}
                        startAngle={0}
                        endAngle={FULL_CIRCLE}
                        color={selectedTheme.grid.color}
                        cornerRadius={selectedTheme.arc.cornerRadius}
                        thickness={thickness}
                      />
                    </g>
                  ) : (
                    pieChartData.map(
                      ({data: pieData, startAngle, endAngle}, index) => {
                        const color = data[index]?.color ?? seriesColor[index];
                        const name = data[index].name;
                        const accessibilityLabel = `${name}: ${pieData.key} - ${pieData.value}`;

                        return (
                          <g
                            key={`${chartId}-arc-${index}`}
                            className={styles.DonutChart}
                            aria-label={accessibilityLabel}
                            role="img"
                          >
                            <Arc
                              isAnimated={shouldAnimate}
                              animationDelay={getAnimationDelayForItems(
                                pieChartData.length,
                              )}
                              index={index}
                              activeIndex={activeIndex}
                              width={diameter}
                              height={diameter}
                              radius={radius}
                              startAngle={startAngle}
                              endAngle={endAngle}
                              color={color}
                              cornerRadius={selectedTheme.arc.cornerRadius}
                              thickness={thickness}
                            />
                          </g>
                        );
                      },
                    )
                  )}
                </g>
              )}
            </svg>
            <InnerValue
              activeValue={activeValue}
              activeIndex={activeIndex}
              isAnimated={shouldAnimate}
              totalValue={totalValue}
              comparisonMetric={comparisonMetric}
              labelFormatter={labelFormatter}
              renderInnerValueContent={renderInnerValueContent}
              diameter={diameter}
              dimensions={dimensions}
            />
          </Fragment>
        ) : (
          <ChartSkeleton
            dimensions={{width: diameter, height: diameter}}
            state={state}
            type="Donut"
            errorText={errorText}
            theme={theme}
          />
        )}
      </div>
      {showLegend && (
        <LegendContainer
          fullWidth={legendFullWidth}
          onDimensionChange={setLegendDimensions}
          colorVisionType={COLOR_VISION_SINGLE_ITEM}
          data={legend}
          direction={legendDirection}
          position={legendPosition}
          maxWidth={maxLegendWidth}
          enableHideOverflow={!isCornerPosition}
          dimensions={{...dimensions, x: 0, y: 0}}
          renderLegendContent={
            shouldRenderLegendContentWithValues
              ? renderLegendContentWithValues
              : renderLegendContent
          }
        />
      )}
    </div>
  );
}
