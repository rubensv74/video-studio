import {Circle, Grid, Layout, Line, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, waitFor} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill('#08111F');

  const card = createRef<Rect>();
  const connector = createRef<Line>();
  const endpoint = createRef<Circle>();

  view.add(
    <>
      <Grid width={'100%'} height={'100%'} spacing={48} stroke={'#29405A'} lineWidth={1} opacity={0.35} />
      <Layout direction={'column'} gap={32} x={-420}>
        <Txt text={'TECHNICAL MOTION ENGINE'} fill={'#42C7B8'} fontSize={28} letterSpacing={5} />
        <Txt text={'Motion Canvas'} fill={'#F7FAFC'} fontSize={88} fontWeight={700} />
        <Txt text={'Diagrams · flows · engineering explainers'} fill={'#93A4B8'} fontSize={30} />
      </Layout>
      <Rect ref={card} x={420} width={520} height={310} radius={24} fill={'#101A2B'} stroke={'#2A3B52'} lineWidth={2} scale={0.82} opacity={0}>
        <Txt text={'Preservation\nWorkflow'} fill={'#F7FAFC'} fontSize={44} fontWeight={650} textAlign={'center'} />
      </Rect>
      <Line ref={connector} points={[[110, 0], [720, 0]]} stroke={'#42C7B8'} lineWidth={6} end={0} endArrow />
      <Circle ref={endpoint} x={720} size={30} fill={'#42C7B8'} scale={0} />
    </>
  );

  yield* all(card().opacity(1, 0.7), card().scale(1, 0.7, easeOutCubic));
  yield* connector().end(1, 1.0, easeOutCubic);
  yield* endpoint().scale(1, 0.35, easeOutCubic);
  yield* waitFor(1.5);
});
