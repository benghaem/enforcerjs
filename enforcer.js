// EnforcerJS V 0.0.1
// The MIT License (MIT)

// Copyright (c) 2015 Benjamin Ghaemmaghami

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var OBJ_REQ_KEYS = ['keys','require']
var OBJ_KEYS = ['keys','require','type']

var enforcer = function(){

	var check_keys = function(obj, require_arr, keys_arr){
		console.log("Checking keys on:")
		console.log(obj)
		console.log("req arr:"+require_arr+", keys arr:"+keys_arr)
		var obj_keys = Object.keys(obj);
		console.log("keys from obj:" + obj_keys)
		var missing_keys = find_missing(require_arr, obj_keys);
		var extra_keys = find_extra(keys_arr, obj_keys);
		if (missing_keys.length > 0){
			throw Error('Missing required key/s: '+missing_keys);
			return false;
		}
		else if (extra_keys.length > 0 && keys_arr[0] !== "*"){
			throw Error('Extra unexpected key/s: '+extra_keys);
			return false;
		}else{
			return true;
		}
		
	}
	
	return{
		ck_keys:check_keys
	}
}()

// Finds keys in key_arr that do not exist in test_arr
function find_missing(key_arr, test_arr){
	var arr_a = key_arr;
	var arr_b = test_arr;
	var miss = [];
	for (var i = arr_a.length - 1; i >= 0; i--) {
		if (arr_b.indexOf(arr_a[i]) === -1) {
			miss.push(arr_a[i])
		};
	};
	return miss;
}


function find_extra(key_arr, test_arr){
	return find_missing(test_arr, key_arr);
}

// Find the difference between the key_arr and the test_arr
function find_diff(key_arr, test_arr){
	return {'missing':find_missing(key_arr,test_arr),'extra':find_extra(key_arr,test_arr)};
}

function top_level(protocol){
	name = protocol['name'];
	style = protocol['style']
	if (style === 'json') {
		return parse_json_top(protocol['enforce']);
	};
}

function parse_json_top(protocol){
	//make nice var name
	var p = protocol

	return parse_json_create_parser(p)
	// var p_req_k = p['require']
	// var p_K = p['keys']

	// //Check for required keys
	// if (enforcer.ck_keys(p,p_req_k,p_K)){
		
	// 	for (var i = Object.keys(p).length - 1; i >= 0; i--) {
	// 		if (Object.keys(p)[i] !==  "#" ){
	// 			// key_extended = parse_json_merge_global(Object.keys(p)[i],p['#'])
	// 			var parser = parse_json_create_parser(key_extended)
	// 			return parser;
	// 		}
	// 	};

		// var req = p['request']
		// var res = p['response']

		// if (p['#']){
		// 	req = parse_json_merge_global(req,p['global']);
		// 	res = parse_json_merge_global(res,p['global']);
		// }
		
		// var req_parser = parse_json_create_parser(req);
		// return req_parser

	// }
}


function parse_json_eval_globals(obj){
	if (obj['type']){
		if (obj['type'] === "object") {
			var obj_keys = obj['keys'].map(convert_key).concat("#");
			for (var i = obj_keys.length - 1; i >= 0; i--) {
				if (obj[obj_keys[i]]['#']){
					return merge_vals(obj,parse_json_eval_globals(obj['#']))
				} 
				else if (obj['#']){
					return merge_vals(obj,obj['#']);
				}
				else{
					return obj;
				}
			};
		}
	}
}

function merge_globals(obj, merge_obj){
	var merge_obj_keys = merge_obj['keys'].map(convert_key)
	console.log('merge_keys',merge_obj_keys)
	var obj_keys = obj['keys'].map(convert_key)
	console.log('obj_keys',obj_keys)
	for (var i = obj_keys.length - 1; i >= 0; i--) {
		console.log('working on',obj_keys[i])
		if (obj[obj_keys[i]]['type'] === "object"){
			obj[obj_keys[i]]['keys'] = obj[obj_keys[i]]['keys'].concat(merge_obj['keys'])
			obj[obj_keys[i]]['require'] = obj[obj_keys[i]]['require'].concat(merge_obj['require'])
			for (var j = merge_obj_keys.length - 1; j >= 0; j--) {
				obj[obj_keys[i]][merge_obj_keys[j]] = merge_obj[merge_obj_keys[j]]
			};
		}
		else{
			console.log('failed obj check')
		}
	};
	return obj;
}



function convert_key(key){
	var out = ""
	if (key === "*"){
		out = key;
	}
	else{
		out = "_"+key
	}
	return out;
}

function parse_json_create_parser(protocol_obj){
	var fn_bank = {}

	parse_json_eval_globals(protocol_obj)


	console.log(protocol_obj)

	console.log('Test deep dive')
	deep_dive_obj(protocol_obj,'top')
	console.log(fn_bank)



	function derive_optional(key,keys,reqs){
		return keys.indexOf(key) !== -1 && reqs.indexOf(key) === -1
	}

	//discover all non object keys and run 
	function deep_dive_obj(obj,name){
		//check for type atribute
		if (obj['type']){
			//if the type is object there may be some keys
			if (obj['type'] === 'object'){

				//grab those keys then check for global marker
				var test_keys = obj['keys'].map(convert_key);

				//there may be a global marker
				if (obj['#']){
					deep_dive_obj(obj['#'])
				}
				console.log(obj)


				
				//iterate over test keys
				for (var i = test_keys.length - 1; i >= 0; i--) {
					//if we found a key --> attempt to deep dive it
					if (obj[test_keys[i]]){
						return deep_dive_obj(obj[test_keys[i]],name + "-" +obj['keys'][i]);
					}
				};
			}
			if (obj['type'] === 'array'){
				console.log('found array')
				if (obj['map2key']){
					console.log('found map2key')
					var newfn = function(val){val.map(obj['map2key'])}
					fn_bank[name] = newfn
				}
			}
			else{
				console.log(obj)
				return;
			}
		}
	}

	var proto_keys = protocol_obj['keys']
	var proto_reqs = protocol_obj['require']

	var working_keys = protocol_obj['keys'].map(convert_key)
	if (working_keys.length === 1 && working_keys[0] === "*"){
		working_keys = [];
	}

	if (enforcer.ck_keys(protocol_obj,OBJ_REQ_KEYS.concat(working_keys),OBJ_KEYS.concat(working_keys))){


		console.log("keys: "+proto_keys)
		console.log("reqs: "+proto_reqs)

		return function(obj){
			var state = true;
			//Check for dynamic requirement updates
			fn_bank_keys = Object.keys(fn_bank)
			console.log("fn bank")
			console.log(fn_bank)
			if (fn_bank_keys.length > 0){
				for (var i = fn_bank_keys.length - 1; i >= 0; i--) {
					obj_value = obj[fn_bank_keys[i]]
					fn_bank_function = fn_bank[fn_bank_keys[i]]
					proto_keys = proto_keys.concat(fn_bank_function(obj_value))
					proto_reqs = proto_reqs.concat(fn_bank_function(obj_value))
				};
				console.log("updated keys: "+proto_keys)
				console.log("updated reqs: "+proto_reqs)
			}

			// Check requirements
			if (enforcer.ck_keys(obj, proto_reqs, proto_keys)){
				//check type if not a wildcard type
				if (proto_keys.length === 1 && proto_keys[0] === "*") {
					// Do nothing
				}
				else {
					console.log("KEYSS again:"+proto_keys);
					for (var i = proto_keys.length - 1; i >= 0; i--) {
						console.log("Working on: " + proto_keys[i])
						console.log("working_key_version: " + working_keys[i])

						var obj_key_type = typeof(obj[proto_keys[i]])
						var proto_key_type = protocol_obj[working_keys[i]]['type']
						// console.log(typeof(obj[proto_keys[i]]),protocol_obj[working_keys[i]]['type'])
						if ( obj_key_type !== proto_key_type ){
							// Could be the array case as array is not a type
							if (obj_key_type === 'object' && Array.isArray(obj[proto_keys[i]])){
								continue;
								//could be an optional atribute
							} else if (obj_key_type === 'undefined' && derive_optional(proto_keys[i],proto_keys,proto_reqs)){
								continue;
								//otherwise bad
							} else{
								console.error("Key type does not match for: "+proto_keys[i])
								state = false
							}
							//if object generate a new parser to parse sub_object
						} else if (obj_key_type === 'object'){
							var object_parser = parse_json_create_parser(protocol_obj[working_keys[i]])
							state = state && object_parser(obj[proto_keys[i]])

						}
					};
				}
			}
			else{
				state = false
			}
			return state;
		}
	}	
}


var parser = function(){

	var generate = function(obj){
		//first check for only object key: "type"
		if (obj['type']){
			//now lets descriminate based on object type:
			switch (obj['type']){
				case "object":

					break;
				case "string":
					break;
				case "array":
					break;
			}


		} else {
			throw Error("object does not have a type key")
		}
	}

	return{
		gen:generate
	}
}()


var enforcerproto ={
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


