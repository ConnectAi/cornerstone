////////////////
//	NATIVES
////////////////
	var express = require("express"),
		http = require("http"),
		path = require("path"),
		RedisStore = require("connect-redis")(express),


////////////////
//	GLOBALS
////////////////
	global.app = {};
	global.server = express();
	global.log = console.log;
	global.Q = require("q");


////////////////
//	SETUP
////////////////
	server
		.set("name", "[framework]")
		.set("views", __dirname + "/external/views")
		.set("view engine", "html")
		.engine("html", require("hbs").__express)
		.use(express.favicon())
		// .use(express.logger('dev'))
		.use(express.bodyParser())
		.use(express.methodOverride())
		.use(express.cookieParser())
		.use(express.session({
			secret: "Shh! It's a secret.",
			store: new RedisStore()
		}))
		.use(require("stylus").middleware({
			src: __dirname + "/external/assets",
			dest: __dirname + "/external/public",
			compress: true,
			debug: true
		}))
		.use(express.static(__dirname + "/external/public"))
		.use(server.router);

	//	Run in passed-in environment.
	//	Defaults to "development".
	if (process.argv.length === 3) {
		server.set("env", process.argv[2]);
	}


////////////////
//	MODULES
////////////////
	var appLoader = Q.defer();
	var resource = require("./internal/resource");

	app.loader = appLoader.promise;
	app.services = resource.load("services");

	app.config = require("./internal/config");
	server.set("port", app.config.port || process.env.PORT || 3000);

	app.utilities = require("./internal/utilities");
	app.router = require("./internal/router");

	app.Controller = require("./internal/Controller");
	app.Model = require("./internal/Model");

	app.controllers = resource.load("controllers");
	app.models = resource.load("models");

	// Lets us access an instance of a model, for convenience.
	app.db = new app.Model();


////////////////
//	BOOTSTRAP
////////////////
	(function(){
	})();


////////////////
//	START
////////////////
	var start = function() {
		http.createServer(server).listen(server.get("port"), function() {
			log("Framework listening at http://%s:%d [%s]", "localhost", server.get("port"), server.get("env"));
		});

		// Now that all the resources have been loaded,
		// run all code that depends on them.
		appLoader.resolve();
	};

exports.start = start;
