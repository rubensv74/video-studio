const get = (obj, key) => obj?.[key];

export const verifyDependencyContract = ({remotionPackage, motionCanvasPackage}) => {
  const errors = [];

  const exact = (label, actual, expected) => {
    if (actual !== expected) {
      errors.push(`${label} must be exactly ${expected}; found ${String(actual)}`);
    }
  };

  const remotionVersion = get(remotionPackage.dependencies, 'remotion');
  const remotionPackages = [
    '@remotion/cli',
    '@remotion/media',
    '@remotion/player',
    '@remotion/three',
  ];

  if (!remotionVersion) {
    errors.push('remotion dependency is required');
  }

  for (const name of remotionPackages) {
    exact(
      `Remotion alignment: ${name}`,
      get(remotionPackage.dependencies, name),
      remotionVersion,
    );
  }

  // Baseline copied from Remotion's official template-three at tag v4.0.528.
  exact('remotion', remotionVersion, '4.0.528');
  exact('react', get(remotionPackage.dependencies, 'react'), '19.2.3');
  exact('react-dom', get(remotionPackage.dependencies, 'react-dom'), '19.2.3');
  exact(
    '@react-three/fiber',
    get(remotionPackage.dependencies, '@react-three/fiber'),
    '9.2.0',
  );
  exact('three', get(remotionPackage.dependencies, 'three'), '0.178.0');
  exact('@types/react', get(remotionPackage.devDependencies, '@types/react'), '19.2.7');
  exact('@types/three', get(remotionPackage.devDependencies, '@types/three'), '0.170.0');
  exact('typescript', get(remotionPackage.devDependencies, 'typescript'), '5.9.3');

  const motionVersion = get(motionCanvasPackage.dependencies, '@motion-canvas/core');
  const motionPackages = [
    '@motion-canvas/2d',
    '@motion-canvas/ffmpeg',
    '@motion-canvas/ui',
    '@motion-canvas/vite-plugin',
  ];

  if (!motionVersion) {
    errors.push('@motion-canvas/core dependency is required');
  }

  for (const name of motionPackages) {
    exact(
      `Motion Canvas alignment: ${name}`,
      get(motionCanvasPackage.dependencies, name),
      motionVersion,
    );
  }

  exact('@motion-canvas/core', motionVersion, '3.17.2');
  exact(
    'Motion Canvas TypeScript',
    get(motionCanvasPackage.devDependencies, 'typescript'),
    '5.2.2',
  );

  const vite = get(motionCanvasPackage.devDependencies, 'vite');
  if (typeof vite !== 'string' || !vite.startsWith('4.')) {
    errors.push(
      `Motion Canvas Vite baseline must stay on Vite 4.x for VS-G01; found ${String(vite)}`,
    );
  }

  return errors;
};
