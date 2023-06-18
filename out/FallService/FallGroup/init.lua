-- Compiled with roblox-ts v2.1.0
local FallGroup
do
	FallGroup = setmetatable({}, {
		__tostring = function()
			return "FallGroup"
		end,
	})
	FallGroup.__index = FallGroup
	function FallGroup.new(...)
		local self = setmetatable({}, FallGroup)
		return self:constructor(...) or self
	end
	function FallGroup:constructor(options)
		self.Characters = {}
		self.Players = {}
	end
end
return {
	FallGroup = FallGroup,
}
