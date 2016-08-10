requirejs.config({
    "baseUrl": "scripts",
    "shim" : {
        "bootstrap" : { "deps" :['jquery'] },
        "dropzone": {
		    "deps": [ 'jquery' ]
		}
    },
    "paths": {
        "mod":       "modules",
        "jquery":    "https://code.jquery.com/jquery-2.2.1.min",
        "bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min",
        "dropzone":  "https://cdnjs.cloudflare.com/ajax/libs/dropzone/4.3.0/dropzone-amd-module",
        "mustache":  "https://cdnjs.cloudflare.com/ajax/libs/mustache.js/2.2.1/mustache"
    }
});

// Load the main app module to start the app
requirejs(["mod/client"]);
