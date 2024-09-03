import { expand, load } from './index';
import { readFileSync } from 'fs';
import mocked = jest.mocked;

jest.mock('fs');

describe('ts-yaml-loader', () => {
  describe('expand', () => {
    it.each`
      placeholder
      ${'${TEST}'}
      ${'$TEST'}
      ${'${test}'}
      ${'$test'}
    `(
      'Must not remove from process.env if strict is false: "$placeholder"',
      ({ placeholder }) => {
        // given
        process.env.TEST = 'test';
        const value = `property: ${placeholder}`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: test');

        // finally
        expect(process.env.TEST).toBeDefined();
        delete process.env.TEST;
      },
    );

    it.each`
      placeholder
      ${'${TEST}'}
      ${'$TEST'}
      ${'${test}'}
      ${'$test'}
    `('Must interpolate env placeholder: "$placeholder"', ({ placeholder }) => {
      // given
      process.env.TEST = 'test';
      const value = `property: ${placeholder}`;

      // when
      const interpolated = expand(value);

      // then
      expect(interpolated).toEqual('property: test');

      // finally
      delete process.env.TEST;
    });

    it.each`
      placeholder
      ${'${NOT_FOUND}'}
      ${'$NOT_FOUND'}
      ${'${not_found}'}
      ${'$not_found'}
    `(
      'Must interpolate to empty when env placeholder: "$placeholder" is not found',
      ({ placeholder }) => {
        // given
        const value = `property: ${placeholder}`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: ');
      },
    );

    it.each`
      placeholder
      ${'${DEFAULT:test}'}
      ${'${default:test}'}
    `(
      'Must interpolate to default when env placeholder: "$placeholder" has default',
      ({ placeholder }) => {
        // given
        const value = `property: ${placeholder}`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: test');
      },
    );

    it.each`
      placeholder
      ${'${PARTIAL}'}
      ${'$PARTIAL'}
      ${'${partial}'}
      ${'$partial'}
    `(
      'Must interpolate env placeholder in partial contexts: "$placeholder"',
      ({ placeholder }) => {
        // given
        process.env.PARTIAL = 'test';
        const value = `property: ${placeholder}:partial`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: test:partial');

        // finally
        delete process.env.PARTIAL;
      },
    );

    it.each`
      placeholder
      ${'${RESPECT_ESCAPED}'}
      ${'$RESPECT_ESCAPED'}
      ${'${respect_escaped}'}
      ${'$respect_escaped'}
    `(
      'Must interpolate env placeholder: "$placeholder" respecting escaped $$',
      ({ placeholder }) => {
        // given
        process.env.RESPECT_ESCAPED = 'test';
        const value = `property: ${placeholder}$$partial`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: test$partial');

        // finally
        delete process.env.RESPECT_ESCAPED;
      },
    );

    it.each`
      placeholder
      ${'${RESPECT_ESCAPED:ZWkT33c$xpYg@6Q?}'}
      ${'${respect_escaped:ZWkT33c$xpYg@6Q?}'}
    `(
      'Must interpolate env placeholder: "$placeholder" respecting escaped $$ in the default value',
      ({ placeholder }) => {
        // given
        const value = `property: ${placeholder}`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual('property: ZWkT33c$xpYg@6Q?');
      },
    );

    it.each`
      placeholder
      ${'${RESPECT_ESCAPED}'}
      ${'$RESPECT_ESCAPED'}
      ${'${respect_escaped}'}
      ${'$respect_escaped'}
    `(
      'Must interpolate multiline env placeholder: "$placeholder" as base64',
      ({ placeholder }) => {
        // given
        process.env.RESPECT_ESCAPED = `-----BEGIN CERTIFICATE-----
MIIEQDCCAqigAwIBAgIUUMiiYh+ixcuNhBlFH9u7XUxKSM4wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNjJkMjk0NGYtNGRlNS00MTA2LTk3NDItY2FkZTcxNzY4
OGY4IFByb2plY3QgQ0EwHhcNMjIwNzA1MTEyNzE5WhcNMjQxMDAyMTEyNzE5WjA/
MRcwFQYDVQQKDA5rYWZrYS0zZDI5ZTIzMTERMA8GA1UECwwIdTZ1M3kyYjMxETAP
BgNVBAMMCGF2bmFkbWluMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA
xbEqJZ21X8ZWXWUzPaU0Pq0grN8Enj/pt0GtRvjSK0c16qlIBSySRYy4K47Z1LJP
wkTD0jB1nXx90mwJNioK/BrtABpASV74jB4p25GN9xhNxfk9DseR5ccIfM3hqF1F
YHeNATX4gftmpr/2hjTHlnX046JCly4n4+ty41wPnOaTMon1S/SqrRc75GA4fZO+
bK0G6Lr67lTzOkf/REFE6UZ55FHM//DIdNjqlkjiXKJXy6yYyoUFgYktP2A4KcVs
cMvnmo3WQSBVVQ1Act22Tp/GbOP+0EjqOLct+rhOXDKPf2KyfvAhUjDk9HMFVcPE
S3AE7VeuPH+7jdS0FmA5k0qWHMvcKTVIet10ulEpCnaUhCISdAzCKu6UlWTWiwOi
2v2DzjDm/jgQOXwbSG4JJga9ikq97MwwoDhZNOThVTZk4evHCXzh1Xl/5H/cfRSM
cdrjfLEkjDcFmsXpIGrLukOpWfSB7Vv0Dkby5CAWtEgB4WZRKh/qUXf5EUzU25JL
AgMBAAGjOTA3MB0GA1UdDgQWBBSAw3F+1Tjn+JoGnh42zGdfRdncTTAJBgNVHRME
AjAAMAsGA1UdDwQEAwIFoDANBgkqhkiG9w0BAQwFAAOCAYEAJvukW6dYGwY187Vu
4XX7gcXEsAXwQMO7/NZSmsfnh6T/UgNymTRvSZZyOcEnaT6qzJdFjinVSmdX24lF
Irv+I8F9SNHsWh2aCbf54hwGATCORAGeEeXWrRNBkyAG5qlbftZ8X7sFAYwLVYyM
EBTIX2TN2VSKrW7zKTRnaMiDk5E+rsPJGU6btE1PRCbhPZYB6umoZtwA9iI6z2WH
iQk3miyI3nf5VPKAyVpq5x8/+H3cAm0s5RcP1rYEoMbpB0QZR6n7s6H3NmxzDF7d
nTQ8T/1uHItl4V8EUaorS2Ki1r0t/r2oZN3+XX/JtqYt09UaiJxpO99LaukHWbyq
swcLnnd870piOydm3RSnP0ar8cQzp0BnVv9E1XajCXe7ntz70YQ0FqGsL3xrx0kd
HbQJmsmSUWC2FOi5LZptkZBdm4gfE3y/UB0AfyG8dPaMm8dpzjd0kcdLZkmv2joi
dwiAyzKxdj7Ge8a/h9BbR+8A07esmP3hGvX0E8fShOgdXzoo
-----END CERTIFICATE-----`;
        const value = `property: ${placeholder}`;

        // when
        const interpolated = expand(value);

        // then
        expect(interpolated).toEqual(
          `property: "-----BEGIN CERTIFICATE-----\\nMIIEQDCCAqigAwIBAgIUUMiiYh+ixcuNhBlFH9u7XUxKSM4wDQYJKoZIhvcNAQEM\\nBQAwOjE4MDYGA1UEAwwvNjJkMjk0NGYtNGRlNS00MTA2LTk3NDItY2FkZTcxNzY4\\nOGY4IFByb2plY3QgQ0EwHhcNMjIwNzA1MTEyNzE5WhcNMjQxMDAyMTEyNzE5WjA/\\nMRcwFQYDVQQKDA5rYWZrYS0zZDI5ZTIzMTERMA8GA1UECwwIdTZ1M3kyYjMxETAP\\nBgNVBAMMCGF2bmFkbWluMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA\\nxbEqJZ21X8ZWXWUzPaU0Pq0grN8Enj/pt0GtRvjSK0c16qlIBSySRYy4K47Z1LJP\\nwkTD0jB1nXx90mwJNioK/BrtABpASV74jB4p25GN9xhNxfk9DseR5ccIfM3hqF1F\\nYHeNATX4gftmpr/2hjTHlnX046JCly4n4+ty41wPnOaTMon1S/SqrRc75GA4fZO+\\nbK0G6Lr67lTzOkf/REFE6UZ55FHM//DIdNjqlkjiXKJXy6yYyoUFgYktP2A4KcVs\\ncMvnmo3WQSBVVQ1Act22Tp/GbOP+0EjqOLct+rhOXDKPf2KyfvAhUjDk9HMFVcPE\\nS3AE7VeuPH+7jdS0FmA5k0qWHMvcKTVIet10ulEpCnaUhCISdAzCKu6UlWTWiwOi\\n2v2DzjDm/jgQOXwbSG4JJga9ikq97MwwoDhZNOThVTZk4evHCXzh1Xl/5H/cfRSM\\ncdrjfLEkjDcFmsXpIGrLukOpWfSB7Vv0Dkby5CAWtEgB4WZRKh/qUXf5EUzU25JL\\nAgMBAAGjOTA3MB0GA1UdDgQWBBSAw3F+1Tjn+JoGnh42zGdfRdncTTAJBgNVHRME\\nAjAAMAsGA1UdDwQEAwIFoDANBgkqhkiG9w0BAQwFAAOCAYEAJvukW6dYGwY187Vu\\n4XX7gcXEsAXwQMO7/NZSmsfnh6T/UgNymTRvSZZyOcEnaT6qzJdFjinVSmdX24lF\\nIrv+I8F9SNHsWh2aCbf54hwGATCORAGeEeXWrRNBkyAG5qlbftZ8X7sFAYwLVYyM\\nEBTIX2TN2VSKrW7zKTRnaMiDk5E+rsPJGU6btE1PRCbhPZYB6umoZtwA9iI6z2WH\\niQk3miyI3nf5VPKAyVpq5x8/+H3cAm0s5RcP1rYEoMbpB0QZR6n7s6H3NmxzDF7d\\nnTQ8T/1uHItl4V8EUaorS2Ki1r0t/r2oZN3+XX/JtqYt09UaiJxpO99LaukHWbyq\\nswcLnnd870piOydm3RSnP0ar8cQzp0BnVv9E1XajCXe7ntz70YQ0FqGsL3xrx0kd\\nHbQJmsmSUWC2FOi5LZptkZBdm4gfE3y/UB0AfyG8dPaMm8dpzjd0kcdLZkmv2joi\\ndwiAyzKxdj7Ge8a/h9BbR+8A07esmP3hGvX0E8fShOgdXzoo\\n-----END CERTIFICATE-----"`,
        );

        // finally
        delete process.env.RESPECT_ESCAPED;
      },
    );
  });

  describe('load', () => {
    it('Must create an object if "any" type is passed', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: test');

      // when
      const config = load<any>({});

      // then
      expect(config.property).toBe('test');
    });

    it('Must skip expand environment variables if "autoExpand" options is false', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: $test');

      // when
      const config = load<any>({ autoExpand: false });

      // then
      expect(config.property).toBe('$test');
    });

    it('Must select sub path of the object if "path" option is set', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue(
        'property: test\ntype: all',
      );

      // when
      const config = load<any>({ path: 'type' });

      // then
      expect(config).toBe('all');
    });

    it('Must create an object if a type is passed', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: test');

      // when
      const config = load<{ property: string }>({});

      // then
      expect(config.property).toBe('test');
    });

    it('Must not populate the data if object is not of the type', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('another: test');

      // when
      const config = load<{ property: string }>({});

      // then
      expect(config.property).toBeUndefined();
    });

    it('Must not populate the data if object does not have the path', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: test');

      // when
      const config = load<{ property: string }>({
        path: 'inner',
        failOnMissing: false,
      });

      // then
      expect(config.property).toBeUndefined();
    });

    it('Must fail if object does not have the path', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: test');

      // when
      expect(() => {
        load<{ property: string }>({
          path: 'inner',
        });
      }).toThrow('Failed to initialize config, the data is missing or invalid');
    });

    it('Must fail if the validation returns an error', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('another: test');

      // when
      expect(() => {
        load<{ property: string }>({
          validate: (value) => {
            if (!value.property) {
              throw new Error('property Must not be null');
            } else {
              return value;
            }
          },
        });
      }).toThrow(
        'Failed to initialize config is not valid: property Must not be null',
      );
    });

    it('Must return the object if the validation passed', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue('property: test');

      // when
      const config = load<{ property: string }>({
        validate: (value) => {
          if (!value.property) {
            throw new Error('property Must not be null');
          } else {
            return value;
          }
        },
      });

      expect(config.property).toBe('test');
    });

    it('Must return multiline data formatted when loading the file', () => {
      // given
      mocked(readFileSync as jest.Mock).mockReturnValue(
        `property: "-----BEGIN CERTIFICATE-----\\nMIIEQDCCAqigAwIBAgIUUMiiYh+ixcuNhBlFH9u7XUxKSM4wDQYJKoZIhvcNAQEM\\nBQAwOjE4MDYGA1UEAwwvNjJkMjk0NGYtNGRlNS00MTA2LTk3NDItY2FkZTcxNzY4\\nOGY4IFByb2plY3QgQ0EwHhcNMjIwNzA1MTEyNzE5WhcNMjQxMDAyMTEyNzE5WjA/\\nMRcwFQYDVQQKDA5rYWZrYS0zZDI5ZTIzMTERMA8GA1UECwwIdTZ1M3kyYjMxETAP\\nBgNVBAMMCGF2bmFkbWluMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA\\nxbEqJZ21X8ZWXWUzPaU0Pq0grN8Enj/pt0GtRvjSK0c16qlIBSySRYy4K47Z1LJP\\nwkTD0jB1nXx90mwJNioK/BrtABpASV74jB4p25GN9xhNxfk9DseR5ccIfM3hqF1F\\nYHeNATX4gftmpr/2hjTHlnX046JCly4n4+ty41wPnOaTMon1S/SqrRc75GA4fZO+\\nbK0G6Lr67lTzOkf/REFE6UZ55FHM//DIdNjqlkjiXKJXy6yYyoUFgYktP2A4KcVs\\ncMvnmo3WQSBVVQ1Act22Tp/GbOP+0EjqOLct+rhOXDKPf2KyfvAhUjDk9HMFVcPE\\nS3AE7VeuPH+7jdS0FmA5k0qWHMvcKTVIet10ulEpCnaUhCISdAzCKu6UlWTWiwOi\\n2v2DzjDm/jgQOXwbSG4JJga9ikq97MwwoDhZNOThVTZk4evHCXzh1Xl/5H/cfRSM\\ncdrjfLEkjDcFmsXpIGrLukOpWfSB7Vv0Dkby5CAWtEgB4WZRKh/qUXf5EUzU25JL\\nAgMBAAGjOTA3MB0GA1UdDgQWBBSAw3F+1Tjn+JoGnh42zGdfRdncTTAJBgNVHRME\\nAjAAMAsGA1UdDwQEAwIFoDANBgkqhkiG9w0BAQwFAAOCAYEAJvukW6dYGwY187Vu\\n4XX7gcXEsAXwQMO7/NZSmsfnh6T/UgNymTRvSZZyOcEnaT6qzJdFjinVSmdX24lF\\nIrv+I8F9SNHsWh2aCbf54hwGATCORAGeEeXWrRNBkyAG5qlbftZ8X7sFAYwLVYyM\\nEBTIX2TN2VSKrW7zKTRnaMiDk5E+rsPJGU6btE1PRCbhPZYB6umoZtwA9iI6z2WH\\niQk3miyI3nf5VPKAyVpq5x8/+H3cAm0s5RcP1rYEoMbpB0QZR6n7s6H3NmxzDF7d\\nnTQ8T/1uHItl4V8EUaorS2Ki1r0t/r2oZN3+XX/JtqYt09UaiJxpO99LaukHWbyq\\nswcLnnd870piOydm3RSnP0ar8cQzp0BnVv9E1XajCXe7ntz70YQ0FqGsL3xrx0kd\\nHbQJmsmSUWC2FOi5LZptkZBdm4gfE3y/UB0AfyG8dPaMm8dpzjd0kcdLZkmv2joi\\ndwiAyzKxdj7Ge8a/h9BbR+8A07esmP3hGvX0E8fShOgdXzoo\\n-----END CERTIFICATE-----"`,
      );

      // when
      const config = load<{ property: string }>();

      expect(config.property).toBe(`-----BEGIN CERTIFICATE-----
MIIEQDCCAqigAwIBAgIUUMiiYh+ixcuNhBlFH9u7XUxKSM4wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNjJkMjk0NGYtNGRlNS00MTA2LTk3NDItY2FkZTcxNzY4
OGY4IFByb2plY3QgQ0EwHhcNMjIwNzA1MTEyNzE5WhcNMjQxMDAyMTEyNzE5WjA/
MRcwFQYDVQQKDA5rYWZrYS0zZDI5ZTIzMTERMA8GA1UECwwIdTZ1M3kyYjMxETAP
BgNVBAMMCGF2bmFkbWluMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEA
xbEqJZ21X8ZWXWUzPaU0Pq0grN8Enj/pt0GtRvjSK0c16qlIBSySRYy4K47Z1LJP
wkTD0jB1nXx90mwJNioK/BrtABpASV74jB4p25GN9xhNxfk9DseR5ccIfM3hqF1F
YHeNATX4gftmpr/2hjTHlnX046JCly4n4+ty41wPnOaTMon1S/SqrRc75GA4fZO+
bK0G6Lr67lTzOkf/REFE6UZ55FHM//DIdNjqlkjiXKJXy6yYyoUFgYktP2A4KcVs
cMvnmo3WQSBVVQ1Act22Tp/GbOP+0EjqOLct+rhOXDKPf2KyfvAhUjDk9HMFVcPE
S3AE7VeuPH+7jdS0FmA5k0qWHMvcKTVIet10ulEpCnaUhCISdAzCKu6UlWTWiwOi
2v2DzjDm/jgQOXwbSG4JJga9ikq97MwwoDhZNOThVTZk4evHCXzh1Xl/5H/cfRSM
cdrjfLEkjDcFmsXpIGrLukOpWfSB7Vv0Dkby5CAWtEgB4WZRKh/qUXf5EUzU25JL
AgMBAAGjOTA3MB0GA1UdDgQWBBSAw3F+1Tjn+JoGnh42zGdfRdncTTAJBgNVHRME
AjAAMAsGA1UdDwQEAwIFoDANBgkqhkiG9w0BAQwFAAOCAYEAJvukW6dYGwY187Vu
4XX7gcXEsAXwQMO7/NZSmsfnh6T/UgNymTRvSZZyOcEnaT6qzJdFjinVSmdX24lF
Irv+I8F9SNHsWh2aCbf54hwGATCORAGeEeXWrRNBkyAG5qlbftZ8X7sFAYwLVYyM
EBTIX2TN2VSKrW7zKTRnaMiDk5E+rsPJGU6btE1PRCbhPZYB6umoZtwA9iI6z2WH
iQk3miyI3nf5VPKAyVpq5x8/+H3cAm0s5RcP1rYEoMbpB0QZR6n7s6H3NmxzDF7d
nTQ8T/1uHItl4V8EUaorS2Ki1r0t/r2oZN3+XX/JtqYt09UaiJxpO99LaukHWbyq
swcLnnd870piOydm3RSnP0ar8cQzp0BnVv9E1XajCXe7ntz70YQ0FqGsL3xrx0kd
HbQJmsmSUWC2FOi5LZptkZBdm4gfE3y/UB0AfyG8dPaMm8dpzjd0kcdLZkmv2joi
dwiAyzKxdj7Ge8a/h9BbR+8A07esmP3hGvX0E8fShOgdXzoo
-----END CERTIFICATE-----`);
    });
  });
});
