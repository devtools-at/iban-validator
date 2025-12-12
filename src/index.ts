/**
 * IBAN Validator
 * Validate IBAN numbers
 *
 * Online tool: https://devtools.at/tools/iban-validator
 *
 * @packageDocumentation
 */

function mod97(iban: string): number {
  let remainder = iban;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
  }
  return parseInt(remainder, 10) % 97;
}

function validateIban(iban: string): IbanValidation {
  const result: IbanValidation = { iban, isValid: false };

  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, "").toUpperCase();

  if (cleaned.length < 15) {
    result.error = "IBAN too short";
    return result;
  }

  // Extract country code
  const countryCode = cleaned.slice(0, 2);
  result.country = countryCode;

  // Check if country is supported
  const spec = ibanSpecs[countryCode];
  if (!spec) {
    result.error = `Country code ${countryCode} not supported`;
    return result;
  }

  result.countryName = spec.name;
  result.flag = spec.flag;

  // Check length
  if (cleaned.length !== spec.length) {
    result.error = `Invalid length: expected ${spec.length}, got ${cleaned.length}`;
    return result;
  }

  // Check characters (letters and digits only)
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    result.error = "IBAN contains invalid characters";
    return result;
  }

  // MOD-97-10 check
  // Move first 4 chars to end and replace letters with numbers (A=10, B=11, etc.)
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );

  const checksum = mod97(numericIban);
  if (checksum !== 1) {
    result.error = "Invalid checksum (MOD-97-10 check failed)";
    return result;
  }

  // Format with spaces (4-char groups)
  result.formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;

  // Extract BBAN (everything after country code and check digits)
  result.bban = cleaned.slice(4);

  // Extract bank code and account number (country-specific)
  // Simplified extraction - first 8 chars as bank code, rest as account
  if (result.bban.length >= 8) {
    result.bankCode = result.bban.slice(0, 8);
    result.accountNumber = result.bban.slice(8);
  }

  result.isValid = true;
  return result;
}

// Export for convenience
export default { encode, decode };
