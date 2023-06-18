-- Compiled with roblox-ts v2.1.0
local TS = _G[script]
local FallGroup = TS.import(script, script, "FallGroup").FallGroup
local FallServiceMode
do
	local _inverse = {}
	FallServiceMode = setmetatable({}, {
		__index = _inverse,
	})
	FallServiceMode.Double = 0
	_inverse[0] = "Double"
	FallServiceMode.Server = 1
	_inverse[1] = "Server"
	FallServiceMode.Client = 2
	_inverse[2] = "Client"
end
local FallService
do
	FallService = {}
	function FallService:constructor()
	end
	function FallService:CreateFallGroup(groupName, options)
		local _object = {}
		local _left = "MinimumDistance"
		local _result = options
		if _result ~= nil then
			_result = _result.MinimumDistance
		end
		local _condition = _result
		if _condition == nil then
			_condition = 5
		end
		_object[_left] = _condition
		local _left_1 = "DamageMultiplier"
		local _result_1 = options
		if _result_1 ~= nil then
			_result_1 = _result_1.DamageMultiplier
		end
		local _condition_1 = _result_1
		if _condition_1 == nil then
			_condition_1 = 0.4
		end
		_object[_left_1] = _condition_1
		local _left_2 = "Materials"
		local _result_2 = options
		if _result_2 ~= nil then
			_result_2 = _result_2.Materials
		end
		local _condition_2 = _result_2
		if _condition_2 == nil then
			_condition_2 = {}
		end
		_object[_left_2] = _condition_2
		local fallGroup = FallGroup.new(_object)
		local _fallGroups = FallService.FallGroups
		local _groupName = groupName
		_fallGroups[_groupName] = fallGroup
		return fallGroup
	end
	function FallService:Init(mode)
		local _arg0 = not self.isInitialized
		assert(_arg0, "You already initialized FallService")
		self.isInitialized = true
		self.fallServiceMode = mode
	end
	FallService.FallGroups = {}
	FallService.isInitialized = false
end
return {
	FallService = FallService,
}
