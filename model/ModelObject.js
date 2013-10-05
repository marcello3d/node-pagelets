var Listenable = require('./Listenable')
module.exports = ModelObject

function ModelObject(initialData) {
    Listenable.call(this)
    this.data = {}
    if (initialData) {
        this.set(initialData)
    }
}
ModelObject.prototype = new Listenable

ModelObject.prototype.$op = function(op) {
    if (op.$set) {

    }
}

ModelObject.prototype.set = function(object) {
    this.$op({$set:object})
//    $set: {
//        "field-path1": value,
//            "field-path2": value2,
//    ...
//    },

}

//{
//    // replace field with completely new value (replaces whole
//    $set: {
//        "field-path1": value,
//            "field-path2": value2,
//    ...
//    },
//    // merge field with new tree
//    $merge: {
//        "field-path1": value,
//            "field-path2": value2,
//    ...
//    },
//    // delete field from object
//    $delete: [
//        "field-path1",
//        "field-path2",
//        ...
//],
//    // number += increment
//    $inc: {
//        "number-path1": increment1,
//            "number-path2": increment2,
//    ...
//    },
//    // array push to end
//    $array_push: {
//        "array-path1": [ value ],
//            "array-path2": [ value1, value2, ... ],
//    ...
//    }
//    // array splice (delete and/or insert at index)
//    $array_splice: {
//        "array-path1": [ index ], // remove index'ed item
//            "array-path2": [ index, length ], // remove length items starting at index
//            "array-path3": [ index, length, newItems ], // remove length items starting at index and insert newItems
//    ...
//    }
//}