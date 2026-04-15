const React = require('react');

const createMockIcon = (name) => {
  const Icon = (props) => React.createElement('Text', props, name);
  Icon.displayName = name;
  return Icon;
};

const Feather = createMockIcon('Feather');
const Ionicons = createMockIcon('Ionicons');
const FontAwesome = createMockIcon('FontAwesome');
const Entypo = createMockIcon('Entypo');

// default export로도 작동하도록
module.exports = { Feather, Ionicons, FontAwesome, Entypo };
module.exports.default = Feather;
module.exports.__esModule = true;
