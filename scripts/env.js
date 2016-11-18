module.exports = function(context) {

  var fs = require("fs");
  var path = require("path");
  var config_target = process.env.config_target || "local"; // default to local
  console.log("Running hook: " + context.hook + ": " + context.scriptLocation);

  var env = (process.argv.indexOf('--release') !== -1) ? 'release' : 'debug',
      rootDir = context.opts.projectRoot,
      wwwDir = path.join(rootDir, 'www'),
      configDir = path.join(rootDir, 'config'),
      defaultConfigPath = path.join(configDir, 'default.json'),
      envConfigPath = path.join(configDir, env + '.json'),
      newConfigPath = path.join(wwwDir, 'config.json'),

      configs = {},
      config = {};

  configs.default = require(defaultConfigPath);
  configs.env = fs.existsSync(envConfigPath) ? require(envConfigPath) : {};

  config = configs.default;

  for(var key in configs.env) {
    if(configs.env.hasOwnProperty(key)) {
      config[key] = configs.env[key];
    }
  }

  fs.writeFileSync(newConfigPath, JSON.stringify(config));
};