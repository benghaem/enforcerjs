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

var enforcer = function(){

	function create(incoming_protocol){
		var protocol = incoming_protocol
		var name = protocol['name'];
		var style = protocol['style']
		if (style === 'json') {
			return eval_json.generate(protocol['enforce']);
		};
	}

	var eval_json = function(){

		var OBJ_REQ_KEYS = ['keys','require','type']
		var OBJ_KEYS = ['keys','require','type']
		
		//various operations to remove macro aspects (globals) from protocol definition
		function generate(protocol){
			//make nice var name
			var p = protocol

			if (p['type']){
				if (p.type === "object"){
					//test req keys
					check_keys(p,OBJ_REQ_KEYS,["*"])

					p = eval_globals(p)
					// remove possible top level global:
					if (p['#']){
						delete p['#']
					}

					return create_enforcer(p)
				}
				if (p.type === "string"){
					return function(x){
						return (typeof(x) === "string")
					}
				}
			}
		}

		function eval_globals(obj){
			if (obj['type']){
				if (obj['type'] === "object") {
					var extra = []
					if (obj['#']){
						extra = ["#"]
					}
					var obj_keys = obj['keys'].map(convert_key).concat(extra)
					if (obj_keys.length === 1 && obj_keys[0] === "*"){
						return obj;
					}
					console.log(obj_keys)
					for (var i = obj_keys.length - 1; i >= 0; i--) {
						if (obj_keys[i] !== '*'){
							if (obj[obj_keys[i]]['#']){
								return merge_globals(obj,parse_json_eval_globals(obj[obj_keys[i]]))
							} 
							else if (obj['#']){
								var cache_obj = obj['#']
								delete obj['#']
								return merge_globals(obj,cache_obj);
							}
							else{
								return obj;
							}
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

		function check_keys(obj, require_arr, keys_arr){
			// Finds keys in key_arr that do not exist in test_arr
			function find_missing(key_arr, test_arr){
				var arr_a = key_arr;
				var arr_b = test_arr;
				var miss = [];
				for (var i = arr_a.length - 1; i >= 0; i--) {
					//Wildcard support. Ignore check if the key array value is a wildcard
					if (arr_a[i] !== '*'){
						if (arr_b.indexOf(arr_a[i]) === -1) {
						miss.push(arr_a[i])
						};
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

			console.log("Checking keys on:")
			console.log(obj)
			console.log("req arr:"+require_arr+", keys arr:"+keys_arr)

			//convert the keys to array
			var obj_keys = Object.keys(obj);

			console.log("keys from obj:" + obj_keys)

			//find the missing keys and any extra keys
			var missing_keys = find_missing(require_arr, obj_keys);
			var extra_keys = find_extra(keys_arr, obj_keys);

			//if we have missing keys throw an error
			if (missing_keys.length > 0){
				throw Error('Missing required key/s: '+missing_keys);
				return false;
			}
			//if we have extra keys and the keys_arr does not contain a wildcard throw an error
			else if (extra_keys.length > 0 && keys_arr.indexOf('*') === -1){
				throw Error('Extra unexpected key/s: '+extra_keys);
				return false;
			//if all is well return true
			}else{
				return true;
			}	
		}

		function create_enforcer(protocol_obj){
			var dyn_bank = {}
			var proto_keys;
			var proto_reqs;
			var working_keys;

			console.log(protocol_obj)

			function derive_optional(key,keys,reqs){
				return keys.indexOf(key) !== -1 && reqs.indexOf(key) === -1
			}


			function append_reqs(arr){
				proto_reqs = proto_reqs.concat(arr)
			}

			function merge_dyn_keys(arr, parser){
				proto_keys = proto_keys.concat(arr)
				working_keys = proto_keys.map(convert_key)
				var converted_arr = arr.map(convert_key)
				for (var i = converted_arr.length - 1; i >= 0; i--) {
					dyn_bank[converted_arr[i]] = {}
					dyn_bank[converted_arr[i]]['parser'] = parser
					dyn_bank[converted_arr[i]]['type'] = "dyn_key"
				};
				
			}


			proto_keys = protocol_obj['keys']
			proto_reqs = protocol_obj['require']

			working_keys = protocol_obj['keys'].map(convert_key)
			if (working_keys.length === 1 && working_keys[0] === "*"){
				working_keys = [];
			}

			for (var i = working_keys.length - 1; i >= 0; i--) {
				if (working_keys[i] !== '*'){
					if(protocol_obj[working_keys[i]]['type'] === 'array'){
						console.log("found array: "+ working_keys[i])
						if (protocol_obj[working_keys[i]]['map2key']){
							var m2k_obj = protocol_obj[working_keys[i]]['map2key']
							console.log(m2k_obj)
							var obj_fn = m2k_obj['fn']
							var new_parser = eval_json.generate(m2k_obj['enforce'])
							dyn_bank[proto_keys[i]] = {}
							dyn_bank[proto_keys[i]]['parser'] = new_parser
							var new_fn = function(x){
								merge_dyn_keys(x.map(obj_fn),new_parser)
							};
							dyn_bank[proto_keys[i]]['fn'] = new_fn;
							
						}
					}
				}
			};

			console.log(dyn_bank)

			// Validate protocol keys
			if (check_keys(protocol_obj,OBJ_REQ_KEYS.concat(working_keys),OBJ_KEYS.concat(working_keys))){

				console.log("keys: "+proto_keys)
				console.log("reqs: "+proto_reqs)

				return function(obj){
					console.log("Started parser")
					var state = true;

					var dyn_bank_keys = Object.keys(dyn_bank)

					for (var i = dyn_bank_keys.length - 1; i >= 0; i--) {
						console.log("found fn bank key")
						//run dyn_bank function based on the value of the object

						//ensure we ignore optionals
						if (obj[dyn_bank_keys[i]]){
							dyn_bank[dyn_bank_keys[i]]['fn'](obj[dyn_bank_keys[i]]);
						}				
					};

					console.log("keys after: "+proto_keys)
					console.log("reqs after: "+proto_reqs)

					// Check requirements
					if (check_keys(obj, proto_reqs, proto_keys)){
						// check type if not a wildcard type
						if (proto_keys.length === 1 && proto_keys[0] === "*") {
							// Do nothing
						}
						else {
							console.log("KEYSS again:"+proto_keys);
							console.log("working_keys"+working_keys)
							for (var i = proto_keys.length - 1; i >= 0; i--) {
								console.log("Working on: " + proto_keys[i])
								console.log("working_key_version: " + working_keys[i])

								var obj_key_type = typeof(obj[proto_keys[i]])
								
								//We need a type for the object. First check if the protocol defines one. Then check if the dyn_bank has an entry
								var proto_key_type;
								if (protocol_obj[working_keys[i]]) {
									proto_key_type = protocol_obj[working_keys[i]]['type']
								}
								else if (dyn_bank[working_keys[i]]) {
									proto_key_type = dyn_bank[working_keys[i]]['type']
								}
								// console.log(typeof(obj[proto_keys[i]]),protocol_obj[working_keys[i]]['type'])
								if ( obj_key_type !== proto_key_type ){
									// Could be the array case as array is not a type
									if (obj_key_type === 'object' && Array.isArray(obj[proto_keys[i]])){
										continue;
										//could be an optional atribute
									} 
									else if (obj_key_type === 'undefined' && derive_optional(proto_keys[i],proto_keys,proto_reqs)){
										continue;
										//otherwise bad
									} 
									else if(proto_key_type === "dyn_key"){
										console.log("dyn_bank",dyn_bank)
										state = state && dyn_bank[working_keys[i]].parser(obj[proto_keys[i]])
									}
									else{
										console.error("Key type does not match for: "+proto_keys[i]+" Should be: "+ proto_key_type)
										state = false
									}
									//if object generate a new parser to parse sub_object
								} else if (obj_key_type === 'object'){
									var object_parser = create_enforcer(protocol_obj[working_keys[i]])
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

		function convert_key(key){
			var out = ""
			if (key === "*"){
				out = key;
			}
			else{
				out = "_"+key;
			}
			return out;
		}

		return{
			generate:generate
		}
	}()

	return{
		create:create,
	}
}()

