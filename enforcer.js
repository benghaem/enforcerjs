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

function parse_json_merge_global(top_level_obj, global){
	top_level_obj['keys'] = top_level_obj['keys'].concat(global['keys'])
	if (top_level_obj['require'][0] !== '*') {
		top_level_obj['require'] = top_level_obj['require'].concat(global['require'])
	};
	for (var i = global['keys'].length - 1; i >= 0; i--) {
		top_level_obj["_"+global['keys'][i]] = global["_"+global['keys'][i]]
	};
	return top_level_obj
}

function parse_json_create_parser(protocol_obj){

	var proto_keys = protocol_obj['keys']
	var proto_reqs = protocol_obj['require']

	var working_keys = protocol_obj['keys'].map(convert_key)
	if (working_keys.length === 1 && working_keys[0] === "*"){
		working_keys = [];
	}

	if (protocol_obj['#']){
		for (var i = proto_keys.length - 1; i >= 0; i--) {
			if (protocol_obj[working_keys[i]]['type'] === 'object'){
				protocol_obj[working_keys[i]] = parse_json_merge_global(protocol_obj[working_keys[i]],protocol_obj['#'])
			}
		};
	}

	delete protocol_obj['#']
	console.log(protocol_obj)

	

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

	function derive_optional(key,keys,reqs){
		return keys.indexOf(key) !== -1 && reqs.indexOf(key) === -1
	}


	if (enforcer.ck_keys(protocol_obj,OBJ_REQ_KEYS.concat(working_keys),OBJ_KEYS.concat(working_keys))){


		console.log("keys: "+proto_keys)
		console.log("reqs: "+proto_reqs)

		return function(obj){
			var state = true;
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


