const copyServerlessEnvironmentValuesToProcessEnvironment = serverless => {
  const serviceEnvironment = serverless.service.provider.environment || {};

  return Object.assign(process.env, serviceEnvironment);
};

module.exports = {
  copyServerlessEnvironmentValuesToProcessEnvironment
};