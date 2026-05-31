'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/** Minimal ECharts wrapper: init once, re-apply the option when it changes. */
export function EChart({ option, height = 300 }: { option: echarts.EChartsOption; height?: number }) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={elRef} style={{ width: '100%', height }} />;
}
