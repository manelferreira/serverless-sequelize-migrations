const setEnvironment = serverless => {
  const serviceEnvironment = serverless.service.provider.environment || {};

  return Object.assign(process.env, serviceEnvironment);
};

const isDatabaseConnectionUrlValid = url => {
  if (!url) 
    return false;
    
  return url.match(
    new RegExp(
      "^(mysql|mariadb|postgres|mssql)(:\\/\\/)(.*)(:)(.*@)(.*:)([0-9]*)(\\/)(.*)"
    )
  );
}

module.exports = {
  setEnvironment,
  isDatabaseConnectionUrlValid
};
