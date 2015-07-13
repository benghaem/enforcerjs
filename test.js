
function test1(){
	var t1_parser = top_level(enforcerproto)
	console.log("generated parser!")
	return t1_parser
	// console.log(t1_parser(test_case_1))
}

function test2(){
	var t2_parser = top_level(stringproto)
	return t2_parser;
}

var stringproto = {
	"name": "String proto",
	"style": "json",
	"enforce": {
		"type": "string"
	}
}

var enforcerproto = {
	"name": "Enforcer.js RPC 1.0",
	"style": "json",
	"enforce":{
		"type":"object",
		"keys": ["global", "wow"],
		"require": ["global"],

		"#":{
			"type":"object",
			"keys":["keys","require","randoobj"],
			"require":["keys","require","randoobj"],

			"#":{
				"type":"object",
				"keys":["special"],
				"require":["special"],

				"_special":{
					"type":"string"
				},
			},

			"_keys":{
				"type": "array",
				"map2key": {
					"fn":function(x){return '_'+x},
					"enforce":{
						"type":"object",
						"keys":["one","two"],
						"require":["one","two"],

						"_one":{
							"type":"number"
						},
						"_two":{
							"type":"string"
						}
					},
				},
			},
			"_require":{
				"type": "array"
			},
			"_randoobj":{
				"type": "object",
				"keys": [],
				"require": [],
			},

		},

		"_global":{
			"type":"object",
			"keys":[],
			"require":[],
		},

		"_wow":{
			"type":"string"
		}
	}
}


//sucess
var test_case_1 = {
	"global":{
		"keys":[],
		"require":[],
	},
}

//should fail as cooolio is not an object
var test_case_2 = {
	"global":{
		"keys":["coolio"],
		"require":[],
		"randoobj":{
			"special":"spec",
		},
		"_coolio":"wow"
	},
	"wow": "wow"
}

//should success!
var test_case_3 = {
	"global":{
		"keys":["coolio"],
		"require":[],
		"randoobj":{
			"special":"spec",
		},
		"_coolio":{
			"one":"one",
			"two":"two"
		},
	},
	"wow": "wow"
}

var test_case_4 = {
	"global":{
			"keys":["crazy"],
			"require":[],
			"randoobj":{
				"special":"spec",
			},
			"_crazy":{
				"one":1,
				"two":"two"
			},
		},
		"wow": "wow"
}


var enforcerproto_old ={
	"name": "Enforcer.js RPC 1.0",
	"style": "json",
	"enforce":{
		"keys": ["global"],
		"require": ["global"],

		"_global":{
			"type":"object",
			"keys":["*"],
			"require":["keys","require"],
			"_keys":{
				"type":"array",
			},
			"_require":{
				"type":"array"
			}
		}
	}
}

//not perfect but will enforce most simple proto

var selfproto = {
	"name": "Enforcer JS Proto Definition",
	"style": "json",
	"enforce":{
		"type":"object",
		"keys":["name","style","enforce"],
		"require":["name","style","enforce"],

		"_name":{
			"type":"string"
		},

		"_style":{
			"type":"string"
		},

		"_enforce":{
			"type":"object",
			"keys":["type","keys","require"],
			"require":["type"],
			"_type":{
				"type":"string"
			},
			"_keys":{
				"type":"array",
				"map2key":{
					"fn":function(x){return '_'+x},
					"enforce":{
						"type":"object",
						"keys":["*","type"],
						"require":["type"],

						"_type":{
							"type":"string"
						},

					},
				}
			},
			"_require":{
				"type":"array"
			}
		}


	}
	
}

var jsonrpc2proto = {
	"name": "JSON-RPC 2.0",
	"style": "json",

	"global" : {
		"keys": ["jsonrpc", "id"],
		"require": ["jsonrpc", "id"],
		"_jsonrpc": {
			"type":"string",
			"fixed":"2.0"
		},
		"_id":{
			"type":"number",
			"%":["trackid"]
		}
	},

	"request": {
		"keys": ["method", "params"],
		"require": ["method"],
		"_method":{
			"type":"string"
		},
		"_params":{
			"type": "object",
			"keys": ["*"],
			"require": [""],
		}
	},

	"response": {
		"keys": ["result","error"],
		"require": [["result","error"]],
		"result_error_mode": "split",
		"result_key": "result",
		"error_key": "error",

		"_error":{
			"type": "object",
			"keys": ["code","message","data"],
			"require": ["*"],
			"_code": {
				"type": "number",
			},
			"_message": {
				"type": "string",
			},
			"_data": {
				"type": "ANY",
			},
		},
	},
}