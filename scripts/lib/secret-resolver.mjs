import {validateCredentialRef} from './access-control.mjs';

export const createSecretResolver = ({
  env = process.env,
  secretProvider,
} = {}) => ({
  resolve: async (reference) => {
    if (!validateCredentialRef(reference)) {
      throw new Error('Secret value must be supplied as a validated credential reference');
    }

    if (reference.startsWith('env:')) {
      const key = reference.slice(4);
      const value = env[key];
      if (!value) throw new Error(`Environment secret is not available: ${key}`);
      return value;
    }

    if (reference.startsWith('secret:')) {
      if (!secretProvider?.resolve) {
        throw new Error('No external secret provider is configured');
      }
      const key = reference.slice(7);
      const value = await secretProvider.resolve(key);
      if (!value) throw new Error(`External secret is not available: ${key}`);
      return value;
    }

    throw new Error('Unsupported credential reference');
  },
});
