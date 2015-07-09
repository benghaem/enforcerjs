function test1(){
	var t1_parser = top_level(enforcerproto)
	console.log("generated parser!")
	return t1_parser
	// console.log(t1_parser(test_case_1))
}

var enforcerproto = {
	"name": "Enforcer.js RPC 1.0",
	"style": "json",
	"enforce":{
		"type":"object",
		"keys": ["global", "wow"],
		"require": ["global"],

		"#":{
			"keys":["keys","require"],
			"require":["keys","require"],
			"_keys":{
				"type": "array",
				"map2key": function(x){return '_'+x},
			},
			"_require":{
				"type": "array"
			}

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

//fail wow of wrong type
var test_case_2 = {
	"global":{
		"keys":[],
		"require":[],
	},
	"wow": {
		"thing": "bad"
	}
}