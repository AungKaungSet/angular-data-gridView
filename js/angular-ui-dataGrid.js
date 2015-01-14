/// <reference path="../Scripts/jquery-2.1.1.min.js" />
(function (angular, factory) {
    if (typeof define == 'function' && define.amd) {
        define('angular-ui-dataGrid', ['angular'], function (angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(typeof angular === 'undefined' ? null : angular, function (angular) {
    var module = angular.module('ngDataGridView', ['ngRepository']);

    module.value('gridOptions', {
        name: "ng-dataGrid",
        dataSource: {}        
    })
    .factory('DataGrid', ['gridOptions', '$window', 'ApiContext', '$rootScope',
        function (gridOptions, $window, ApiContext, $rootScope) {

            function DataGrid(options) {
                var settings = angular.copy(gridOptions);
                angular.extend(this, settings, options, {
                    rowIndex: -1,
                    colIndex: -1,
                    pageIndex: 0,
                    dataIndex: -1,
                });
            };

            DataGrid.prototype.DataBind = function () {
                var that = this,
                    gridContext = new ApiContext({ isSingle: true });
                if (that.dataSource.data === undefined) {
                    gridContext.createContext({
                        key: that.name,
                        url: that.dataSource.url,
                        urlParams: that.dataSource.urlParams === undefined ? "" : that.dataSource.urlParams
                    });
                    gridContext.getList().then(function (response) {
                        that.dataSource.data = response;                        
                    }, function (response) {
                        throw new Error(response);
                    })
                }
            }            

            return DataGrid;
        }])
        .factory("GridBuilder", function () {
            function GridBuilder(options) {
                angular.extend(this, options, {
                    id: "",
                    gridItemName: "",
                    dataGridName: "dataGridController.dataGridView",
                    dataSourceString: "dataGridController.dataGridView.dataRows",
                    columns: [],
                    rowDataKey: "",
                    height: 400,
                    allowPagging: '',
                    pageSize: 10,
                    cssClass: "",
                    showFooter: '',
                    showHeader: '',
                    headerCssClass: "",
                    footerCssClass: "",
                    itemCssClass: "",                    
                    footerTemplate: ""
                });
                this._init(options.element, options.attr);
            };

            GridBuilder.prototype._init = function (element, attr) {
                var that = this,
                    columns = element.find("columns"),
                        boundField = {
                            headerText: "",
                            showHeader: '',
                            visible: '',
                            dataFieldName: "",
                            filter: "",
                            cssClass: ""
                        },
                        buttonField = {
                            text: "",
                            showHeader: '',
                            visible: '',
                            commandName: "",
                            cssClass: ""
                        },
                        templateField = {
                            showHeader: '',
                            visible: '',
                            headerText: "",
                            itemTemplate: '',
                            editItemTemplate: ''
                        },
                        list = [];

                //Decide Fields                
                for (var i = 0; i < columns[0].children.length; i++) {

                    var isBound, isTemplate, isButton;
                    item = angular.element(columns[0].children[i]);
                    switch (item[0].localName) {
                        case "boundfield":
                            isBound = true;
                            break;
                        case "templatefield":
                            isTemplate = true;
                        case "buttonfield":
                            isButton = true;
                        default:
                            isBound = true;
                    }
                    if (isBound) {
                        boundField.cssClass = item.attr("css-class") == undefined ? "" : item.attr("css-class");
                        boundField.dataFieldName = item.attr("data-field-name") == undefined ? "dataField" : item.attr("data-field-name");
                        boundField.headerText = item.attr("header-text") == undefined ? boundField.dataFieldName : item.attr("header-text");
                        boundField.showHeader = item.attr("show-header") == undefined ? true : item.attr("show-header");
                        boundField.visible = item.attr("visible") == undefined ? true : item.attr("visible");
                        boundField.filter = item.attr("filter") == undefined ? "" : item.attr("filter");
                        boundField.rowType = "boundField";
                        list[i] = boundField;
                    }
                    if (isButton) {
                        buttonField.cssClass = item.attr("css-class") == undefined ? "" : item.attr("css-class");
                        buttonField.text = item.attr("text") == undefined ? "" : item.attr("text");
                        buttonField.commandName = item.attr("command-name") == undefined ? buttonField.text.trim(' ').toLowerCase() : item.attr("command-name");
                        buttonField.showHeader = item.attr("show-header") == undefined ? true : item.attr("show-header");
                        buttonField.visible = item.attr("visible") == undefined ? true : item.attr("visible");
                        that.columns.push(buttonField);
                    }

                    if (isTemplate) {
                        that.templateField.headerText = item.attr("header-text") == undefined ? "" : item.attr("header-text");
                        that.templateField.showHeader = item.attr("show-header") == undefined ? true : item.attr("show-header");
                        that.templateField.visible = item.attr("visible") == undefined ? true : item.attr("visible");
                        var templateItems = item.children;
                        angular.forEach(templateItems, function (itemChildren) {
                            var childItems = angular.element(itemChildren);
                            switch (childItems.localName.toLowerCase()) {
                                case "itemtemplate":
                                    that.templateField.itemTemplate = childItems.innerHTML;
                                    break;
                                case "edititemtemplate":
                                    that.templateField.editItemTemplate = childItems.innerHTML;
                                    break;
                            }
                        });
                        that.columns[index] = { templateField: that.templateField };
                    }
                }
                

                that.cssClass = attr.cssClass == undefined ? "" : attr.cssClass;
                that.allowPagging = attr.allowPagging == undefined ? false : attr.allowPagging;
                that.pageSize = attr.pageSize == undefined ? 10 : attr.pageSize;
                that.height = attr.height == undefined ? 400 : attr.height;
                that.rowDataKey = attr.rowDataKey == undefined ? "" : attr.rowDataKey;
                that.showFooter = attr.showFooter == undefined ? false : attr.showFooter;
                that.showHeader = attr.showHeader == undefined ? true : attr.showHeader;
                that.gridItemName = attr.gridItemName == undefined ? "" : attr.gridItemName;
                that.headerCssClass = attr.headerCssClass == undefined ? "" : attr.headerCssClass;
                that.footerCssClass = attr.footerCssClass == undefined ? "" : attr.footerCssClass;
                that.itemCssClass = attr.itemCssClass == undefined ? "" : attr.itemCssClass;
                that.id = attr.id == undefined ? "gridView" : attr.id;
                that.footerTemplate = element.find("footerTemplate");
                that.columns = list;
            };

            GridBuilder.prototype._grid = function () {
                var that = this,
                    table = angular.element("<table></table>"),
                    thead = angular.element("<thead></thead>"),
                    tbody = angular.element("<tbody></tbody>"),
                    tfoot = angular.element("<tfoot></tfoot>");
                table.addClass(that.cssClass);
                table.attr("id", that.id);
                thead.addClass(that.headerCssClass);
                tbody.addClass(that.itemCssClass);
                tfoot.addClass(that.footerCssClass);
                table.append(thead);
                table.append(tbody);
                if (that.showFooter == "true" && that.footerTemplate != undefined) {
                    var tr = angular.element("<tr></tr>");
                    angular.forEach(item.find("columns"), function (item) {
                        var td = angular.element("<td></td>");
                        td.append(item.innerHTML);
                        tr.append(td);
                    });
                    tfoot.append(tr);
                    table.append(tfoot);
                }
                return table;
            }

            GridBuilder.prototype._header = function () {
                var that = this,
                    header = angular.element("<tr></tr>");
                angular.forEach(that.columns, function (item) {
                    var text = "",
                        show = true,
                        td = angular.element("<th></th>");
                    if (item.boundField != undefined) {
                        text = item.boundField.headerText;
                        show = item.boundField.showHeader;
                        td.attr("ng-show", show);
                        td.append(text);
                    }
                    else if (item.buttonField != undefined) {
                        text = item.buttonField.text;
                        show = item.buttonField.showHeader;
                        td.attr("ng-show", show);
                        td.append(text);
                    }
                    else if (item.templateField != undefined) {
                        text = item.templateField.headerText;
                        show = item.templateField.showHeader;
                        td.attr("ng-show", show);
                        td.append(text);
                    }
                    header.append(td);
                });
                return header;
            };

            GridBuilder.prototype._body = function () {
                var that = this,
                    body = angular.element("<tr></tr>");
                body.attr("ng-repeat", "(index, " + that.gridItemName + ") in " + this.dataSourceString)
                body.attr("row-index", "index");
                angular.forEach(that.columns, function (item) {
                    if (item.boundField != undefined) {
                        var td = angular.element("<td></td>");
                        var span = angular.element("<span></span>");
                        span.addClass(item.boundField.cssClass);
                        if (item.boundField.filter !== "") {
                            span.append("{{" + that.gridItemName + "." + item.boundField.dataFieldName + " | " + item.boundField.filter + "}}");
                        } else {
                            span.append("{{" + that.gridItemName + "." + item.boundField.dataFieldName + "}}");
                        }
                        td.append(span);
                        body.append(td);
                    }
                    else if (item.buttonField != undefined) {
                        var td = angular.element("<td></td>");
                        var button = angular.element("<button></button>");
                        button.addClass(item.buttonField.cssClass);
                        button.val(item.buttonField.text);
                        button.attr("name", item.buttonField.commandName);
                        td.append(button);
                        body.append(td);
                    }
                    else if (item.templateField != undefined) {
                        var itemTd = angular.element("<td></td>");
                        itemTd.attr("ng-show", that.dataGridName + ".EditIndex != index");
                        var editTd = angular.element("<td></td>");
                        editTd.attr("ng-show", that.dataGridName + ".EditIndex == index");
                        if (item.templateField.itemTemplate != undefined) {
                            itemTd.append(item.templateField.itemTemplate);
                            body.append(itemTd);
                        }
                        if (item.templateField.editItemTemplate != undefined) {
                            editTd.append(item.templateField.editItemTemplate);
                            body.append(editTd);
                        }
                    }
                });
                return body;
            }

            GridBuilder.prototype.Build = function () {
                var table = this._grid();
                var header = this._header();
                var body = this._body();

                var thead = table.find("thead");
                var tbody = table.find("tbody");
                thead.append(header);
                tbody.append(body);
                return table;
            }

            return GridBuilder;
        })
        .directive('gridView', ['DataGrid', 'GridBuilder', function (DataGrid, GridBuilder) {
            return {
                restrict: 'EA',
                scope: true,
                template: function (ele, attr) {                    
                    var gridBuilder = new GridBuilder({ element: ele, attr: attr });
                    var str = gridBuilder.Build();
                    return str;
                },
                controllerAs: "gridController",
                controller: function ($scope, $element, $attrs, $parse) {                    
                    this.dataGrid = new DataGrid({
                        dataSource: $scope.$eval($attrs.gridDataSource),
                        name: $attrs.id
                    });
                    this.dataGrid.DataBind();
                }
            }
        }]);
    return module;
}));


function NoNeed() {
    /*

var col = [],
                        headerCssClass = attr.headerCssClass,
                        height = attr.height,
                        rowDataKey = attr.rowDataKey,
                        cssClass = attr.cssClass,
                        id = attr.id,
                        showFooter = attr.showFooter;
var columns = ele.find("columns");
var footerTemplate = ele.find("footerTemplate");
angular.forEach(columns, function (item) {
    var colEle = angular.element(item);
    col.push({
        field: colEle.attr("field"),
        title: colEle.attr("title"),
        type: colEle.attr("type"),
        visible: colEle.attr("visible"),
        name: colEle.attr("name"),
        displayHeader: colEle.attr("display-header")
    });
});

var gridHeader = function () {
    var header = headerCssClass === "" ? '<thead>' : '<thead class="' + headerCssClass + '">';
    header += '<tr>';
    angular.forEach(col, function (item) {
        var title = item.title == "" ? item.field : item.title;
        var str = '<th>';
        if (item.displayHeader == 'true') {
            str += title;
        }
        str += '</th>';
        header += str;
    });
    header += '</tr></thead>';
    return header;
}

var gridBody = function () {
    var body = '<tbody>';
    body += '<tr ng-repeat="obj in gridController.dataGrid.dataSource.data">';
    angular.forEach(col, function (item) {
        switch (item.type.toString().toLowerCase()) {
            case 'boundfield':
                body += '<td>{{obj.' + item.field + '}}</td>';
                break;
            case 'buttonfield':
                body += '<td><button row-data-key="obj.' + rowDataKey
                    + '" row-type="button" name="' + item.name + '">'
                    + item.title + '</button>';
                break;
            case 'templatefield':
                body += item.template;
            default:
                body += '<td>{{obj.' + item.field + '}}</td>';
                break;
        }
    });
    body += '</tr></tbody>';
    return body;
}

var grid = function () {
    var that = this;
    var table = cssClass == "" ? '<table id="' + id + '">' : '<table id="' +
    id + '" class="' + cssClass + '">';
    table += gridHeader();
    table += gridBody();
    if (showFooter == 'true') {
        table += '<tfoot><tr>';
        var footer = footerTemplate[0].children;
        angular.forEach(footer, function (item) {
            table += '<td>' + item.outerHTML + '</td>';
        });
    }
    table += '</table>'
    return table;
}

var str = grid();
*/
}
