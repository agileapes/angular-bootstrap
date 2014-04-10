/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @date 14/4/5 AD
 */
(function () {
    'use strict';

    var module = angular.module("buMockDom", []);

    module.provider('bu$mock$domBuilder', function () {
        var domBuilder = {
            element: function (nodeName, nodeType) {
                nodeName = nodeName || "";
                nodeType = nodeType || 1;
                var attributes = {
                    items: [],
                    length: 0,
                    set: function (name, value) {
                        var attribute = attributes.get(name);
                        if (!attribute) {
                            attribute = {
                                name: name.toLowerCase(),
                                value: value,
                                index: attributes.length
                            };
                            attributes.items.push(attribute);
                            attributes.length ++;
                        } else {
                            attributes.items[attribute.index] = {
                                name: name,
                                value: value,
                                index: attribute.index
                            };
                        }
                    },
                    get: function (name) {
                        for (var i = 0; i < attributes.items.length; i++) {
                            var attribute = attributes.items[i];
                            if (attribute.name.toLowerCase() == name.toLowerCase()) {
                                return attribute;
                            }
                        }
                        return undefined;
                    },
                    remove: function (name) {
                        var attribute = attributes.get(name);
                        if (!attribute) {
                            return;
                        }
                        attributes.items.splice(attribute.index, 1);
                        attributes.length --;
                        for (var i = attribute.index; i < attributes.items.length; i ++) {
                            attributes.items[i].index --;
                        }
                    },
                    item: function (index) {
                        return attributes.length > index && index >= 0 ? attributes.items[index] : undefined;
                    }
                };
                var children = {
                    items: [],
                    add: function (child) {
                        children.items.push(child);
                        var index = children.items.length - 1;
                        child.parentNode = node;
                        child.nodeIndex = index;
                        child.previousSibling = null;
                        child.nextSibling = null;
                        if (index > 0) {
                            children.items[index - 1].nextSibling = child;
                            child.previousSibling = children.items[index - 1];
                        }
                        if (index == 0) {
                            node.firstChild = child;
                        }
                        node.lastChild = child;
                    },
                    remove: function (child) {
                        if (child.nodeNode !== node) {
                            throw new Error("Cannot remove non-child element");
                        }
                        var index = child.nodeIndex;
                        if (children.items.length <= childIndex || childIndex < 0) {
                            throw new Error("Cannot remove non-child element");
                        }
                        children.items.splice(index, 1);
                        for (var i = index; i < children.items.length; i++) {
                            children.items[i].nodeIndex --;
                        }
                    }
                };
                var node = {
                    toString: function () {
                        return nodeName.toUpperCase() + "Element";
                    },
                    nodeName: nodeName.toLowerCase(),
                    nodeType: nodeType,
                    attributes: attributes,
                    setAttribute: function (name, value) {
                        attributes.set(name, value);
                    },
                    getAttribute: function (name) {
                        return attributes.get(name);
                    },
                    removeAttribute: function (name) {
                        attributes.remove(name);
                    },
                    firstChild: null,
                    lastChild: null,
                    previousSibling: null,
                    nextSibling: null,
                    children: children.items,
                    appendChild: function (child) {
                        children.add(child);
                    },
                    removeChild: function (child) {
                        children.remove(child);
                    }
                };
                return node;
            },
            node: function (nodeName, children, _) {
                var element = domBuilder.element(nodeName, 1);
                element._updateInnerHTML = function () {
                    var src = "";
                    for (var i = 0; i < element.children.length; i++) {
                        var child = element.children[i];
                        if (child.nodeValue) {
                            if (child.nodeType == 8) {
                                src += "<!--"
                            }
                            src += child.nodeValue;
                            if (child.nodeType == 8) {
                                src += "-->"
                            }
                        } else {
                            src += child.outerHTML;
                        }
                    }
                    element.innerHTML = src;
                    element._updateOuterHTML();
                };
                element._updateOuterHTML = function () {
                    var src = "<" + element.nodeName;
                    if (element.attributes.length > 0) {
                        for (var i = 0; i < element.attributes.length; i++) {
                            var attribute = element.attributes.items[i];
                            src += " " + attribute.name + "=\"" + attribute.value + "\"";
                        }
                    }
                    src += ">";
                    src += element.innerHTML;
                    src += "</" + element.nodeName + ">";
                    element.outerHTML = src;
                    if (element.parentNode && angular.isFunction(element.parentNode._updateOuterHTML)) {
                        element.parentNode._updateOuterHTML();
                    }
                };
                element.innerHTML = "";
                element.outerHTML = "";
                element._updateInnerHTML();
                var _appendChild = element.appendChild;
                var _removeChild = element.removeChild;
                var _setAttribute = element.setAttribute;
                element.appendChild = function (child) {
                    _appendChild(child);
                    element._updateInnerHTML();
                };
                element.removeChild = function (child) {
                    _removeChild(child);
                    element._updateInnerHTML();
                };
                element.setAttribute = function (name, value) {
                    _setAttribute(name, value);
                    element._updateOuterHTML();
                };
                element.getElementById = function (id) {
                    var node = element.firstChild;
                    while (node) {
                        if (node.getAttribute('id') == id) {
                            return node;
                        }
                        node = node.nextSibling;
                    }
                    return undefined;
                };
                element.getElementsByTagName = function (tagName) {
                    var node = element.firstChild;
                    var result = [];
                    while (node) {
                        if (node.nodeName.toLowerCase() == tagName.toLowerCase()) {
                            result.push(node);
                        }
                        if (node.getElementsByTagName) {
                            var elements = node.getElementsByTagName(tagName);
                            for (var i = 0; i < elements.length; i++) {
                                result.push(elements[i]);
                            }
                        }
                        node = node.nextSibling;
                    }
                    return result;
                };
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i ++) {
                        element.appendChild(arguments[i]);
                    }
                }
                return element;
            },
            comment: function (comment) {
                var element = domBuilder.element("#comment", 8);
                element.nodeValue = comment;
                element.getAttribute = element.setAttribute = element.removeAttribute = element.removeChild = element.appendChild = function () {
                    throw new Error("Unsupported operation");
                };
                return element;
            },
            text: function (text) {
                var element = domBuilder.element("#text", 3);
                element.nodeValue = text;
                element.getAttribute = element.setAttribute = element.removeAttribute = element.removeChild = element.appendChild = function () {
                    throw new Error("Unsupported operation");
                };
                return element;
            }
        };
        this.$get = function () {
            return domBuilder;
        };
    });

    module.run(function (bu$mock$domBuilder) {
        module.value('bu$mock$document', bu$mock$domBuilder.node('HTML'));
    });

})();