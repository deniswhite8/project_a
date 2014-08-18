define(['avatars/man', 'avatars/panzer', 'avatars/car', 'avatars/passage'], function () {
	var avatars = {};

	for (var i = 0; i < arguments.length; i++)
		avatars[arguments[i].name] = arguments[i];

	return avatars;
});