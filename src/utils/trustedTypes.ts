interface TrustedTypesPolicyLike {
  createScript(input: string): unknown;
}

interface TrustedTypesFactoryLike {
  createPolicy(
    policyName: string,
    policyOptions: { createScript: (input: string) => string }
  ): TrustedTypesPolicyLike;
}

let jsonLdPolicy: TrustedTypesPolicyLike | null | undefined;

function getJsonLdPolicy(): TrustedTypesPolicyLike | null {
  if (jsonLdPolicy !== undefined) {
    return jsonLdPolicy;
  }

  const tt = (globalThis as { trustedTypes?: TrustedTypesFactoryLike }).trustedTypes;
  if (!tt || typeof tt.createPolicy !== 'function') {
    jsonLdPolicy = null;
    return null;
  }

  try {
    jsonLdPolicy = tt.createPolicy('app-jsonld', {
      createScript(input: string): string {
        JSON.parse(input);
        return input;
      },
    });
  } catch {
    jsonLdPolicy = null;
  }

  return jsonLdPolicy;
}

/**
 * JSON-LD 文字列を検証し、Trusted Types 対応環境では TrustedScript を返す。
 */
export function toTrustedJsonLdScript(jsonString: string): string {
  JSON.parse(jsonString);
  const policy = getJsonLdPolicy();
  if (!policy) {
    return jsonString;
  }
  return policy.createScript(jsonString) as string;
}
