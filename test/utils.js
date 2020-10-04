const { expect } = require("chai");
const utils = require("../lib/utils");

describe("utils", () => {
  describe("Copy serverless project environment variables on process.env", () => {
    it("should have undefined values", () => {
      const serverless = {
        service: {
          provider: {}
        }
      };
      
      utils.copyServerlessEnvironmentValuesToProcessEnvironment(serverless);
      
      expect(process.env.PROVIDER_VAR).to.be.equal(undefined);
      expect(process.env.FUNCTION_VAR).to.be.equal(undefined);
    });

    it("copies environment variables to process.env", () => {
      const serverless = {
        service: {
          provider: {
            environment: {
              PROVIDER_VAR: "provider variable",
              PROVIDER_VAR_2: 1
            }
          },
          functions: {}
        }
      };

      utils.copyServerlessEnvironmentValuesToProcessEnvironment(serverless);

      expect(process.env.PROVIDER_VAR).to.be.equal("provider variable");
      expect(process.env.PROVIDER_VAR_2).to.be.equal("1");
    });
  });
});
