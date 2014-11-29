$(function () {
    WorkSiteBrowser.Init();

    $("#browse").click(function () {
        var folders = WorkSiteBrowser.SelectFolders();

        if (folders) {
            FolderManager.Init(folders)
            FolderManager.Insert();
        }
    });
});

var WorkSiteFolder = (function () {
    // *** private properties
    var _serviceUrl = "http://localhost:666/FolderMapperService/api/folders/";
    var _dmsUsername = "sschoch";
    var _dmsPassword = "Ph0en1xbs";

    // *** public properties
    this.Id;
    this.ParentId;
    this.Server;
    this.Database;

    // summary
    this.Name;
    this.Type;
    this.SubFolderCount;
    this.DocumentCount;

    // template
    this.Template;
    this.SummaryRowRef;
    this.ButtonRowRef;
    this.DetailsRowRef;
    this.TreeRef;
    this.GridRef;

    // data
    this.TreeData;
    this.ActiveNodeRef;

    // *** constructor
    function WorkSiteFolder(id, parentId, server, database, type) {
        this.Id = id;
        this.ParentId = parentId;
        this.Server = server;
        this.Database = database;
        this.Type = type;
        this.Template = $("#folder-template").clone();
    }

    // *** private methods
    function _databind() {
        var folder = this;
        folder.Template.find("#id-pbs-0").text(folder.Id);
        folder.Template.find("#name-pbs-0").text(folder.Name);
        folder.Template.find("#type-pbs-0").text(folder.Type);
        folder.Template.find("#subfolders-pbs-0").text(folder.SubFolderCount);
        folder.Template.find("#documents-pbs-0").text(folder.DocumentCount);
        folder.Template.find("#hdn-objectid-pbs-0").val(folder.Id);
        folder.Template.find("#btn-showdetails-pbs-0").attr("onclick", "FolderManager.ShowDetails(this.id.replace('btn-showdetails-pbs-', '')); return false;");
        folder.Template.find("#btn-remove-pbs-0").attr("onclick", "FolderManager.Remove(this.id.replace('btn-remove-pbs-', '')); return false;");
        folder.Template.find("[id$='pbs-0']").each(function () {
            this.id = this.id.replace(0, folder.Id);
        });
    }

    function _showGrid() {
        var folder = this;
        var gridPanel = folder.DetailsRowRef.find("#grid-panel-pbs-" + folder.Id);

        folder.GridRef.dataTable({
            data: folder.ActiveNodeRef.documents,
            columns:
            [
                { "data": "docnum" },
                { "data": "description" }
            ],
            pagingType : "simple",
            initComplete: function () {
                var gridPlaceholder = folder.DetailsRowRef.find("#grid-placeholder-pbs-" + folder.Id);
                gridPlaceholder.fadeOut("fast", function () {
                    gridPanel.show();
                });

                var dt = folder.GridRef.dataTable().api();

                var lastIdx = null;
                folder.GridRef.on("mouseover", "td", function () {
                    if (dt.cell(this).index()) {
                        var colIdx = dt.cell(this).index().column;

                        if (colIdx !== lastIdx) {
                            $(dt.cells().nodes()).removeClass("highlight");
                            $(dt.column(colIdx).nodes()).addClass("highlight");
                        }
                    }
                })
                .on("mouseleave", function () {
                    $(dt.cells().nodes()).removeClass("highlight");
                })
                .on("click", "tr", function () {
                    $(this).toggleClass("active");
                })

                folder.DetailsRowRef.find("#btn-grid-selectall-pbs-" + folder.Id).on("click", function () {
                    folder.GridRef.find("tr").each(function () {
                        $(this).addClass("active");
                    });
                    return false;
                });

                folder.DetailsRowRef.find("#btn-grid-deselectall-pbs-" + folder.Id).on("click", function () {
                    folder.GridRef.find("tr").each(function () {
                        $(this).removeClass("active");
                    });
                    return false;
                });

                folder.DetailsRowRef.find("#btn-grid-removeselected-pbs-" + folder.Id).on("click", function () {
                    dt.row(".active").remove().draw(false);
                    folder.ActiveNodeRef.documents = dt.data();
                    return false;
                });
            }
        });
    }

    function _renderGrid() {
        var folder = this;
        var gridPanel = folder.DetailsRowRef.find("#grid-panel-pbs-" + folder.Id);

        if ($.fn.dataTable.isDataTable(folder.GridRef)) {
            var gridPlaceholder = folder.DetailsRowRef.find("#grid-placeholder-pbs-" + folder.Id);
            gridPanel.fadeOut("fast", function () {
                folder.GridRef.dataTable().fnDestroy();
                var parent = folder.GridRef.parent();
                folder.GridRef.remove();
                // todo: refactor this
                parent.append(
'<table id="grid-pbs-' + folder.Id + '" class="table table-striped table-bordered">' +
'   <thead>' +
'       <tr>' +
'           <th>DocNum</th>' +
'           <th>Description</th>' +
'       </tr>' +
'   </thead>' +
'</table>'
                );
                folder.GridRef = folder.DetailsRowRef.find("#grid-pbs-" + folder.Id);
                gridPlaceholder.show();
                _showGrid.call(folder);
            });
        } else {
            _showGrid.call(folder);
        }
    }

    function _findNode(tree, nodeId) {
        var result;
        var node = $.grep(tree, function (item) {
            if (nodeId != item.id) {
                if (Array === item.children.constructor) {
                    var node2 = _findNode(item.children, nodeId);
                    if (node2) {
                        result = node2;
                    }
                }
            } else {
                return true;
            }
            return false;
        })[0]
        if (node) {
            result = node;
        }
        return result;
    }

    function _initGrid(nodeId) {
        var folder = this;

        if (nodeId == folder.TreeData.id) {
            folder.ActiveNodeRef = folder.TreeData;
        } else {
            folder.ActiveNodeRef = $.grep(folder.TreeData.children, function (item) {
                return nodeId == item.id;
            })[0];
        }

        if (Array !== folder.ActiveNodeRef.documents.constructor) {
            if (true === folder.ActiveNodeRef.documents) {
                $.ajax({
                    url: _serviceUrl + folder.Database + "/" + nodeId + "/documents",
                    headers: { "dmsServer": folder.Server, "dmsUsername": _dmsUsername, "dmsPassword": _dmsPassword },
                    type: "get",
                    dataType: "json",
                    cache: false,
                    success: function (documents) {
                        folder.ActiveNodeRef.documents = documents;
                        _renderGrid.call(folder);
                    }
                });
            } else {
                _renderGrid.call(folder);
            }
        } else {
            _renderGrid.call(folder);
        }
    }

    function _renderTree() {
        var folder = this;
        folder.TreeRef.on("activate_node.jstree", function (e, data) {
            var nodeId = data.node.id;
            _initGrid.call(folder, nodeId)
        })
        .jstree({
            "core": {
                "check_callback": true,
                "data": function (node, cb) {
                    if ("#" === node.id) {
                        // root node
                        var treeData = $.extend(true, {}, folder.TreeData);
                        cb.call(this, treeData);
                    } else {
                        // leaf node
                        var treeData = null;
                        //var expandedNode = $.grep(folder.TreeData.children, function (item) {
                        //    return node.id == item.id;
                        //})[0];
                        var expandedNode = _findNode(folder.TreeData.children, node.id);

                        if (Array === expandedNode.children.constructor) {
                            treeData = $.extend(true, {}, expandedNode);
                            cb.call(this, treeData);
                        } else {
                            $.ajax({
                                url: _serviceUrl + folder.Database + "/" + node.id + "/folder/tree",
                                headers: { "dmsServer": folder.Server, "dmsUsername": _dmsUsername, "dmsPassword": _dmsPassword },
                                type: "get",
                                dataType: "json",
                                cache: false,
                                success: function (result) {
                                    expandedNode.children = result.children;
                                    treeData = $.extend(true, {}, expandedNode);
                                    cb.call(this, treeData);
                                }
                            });
                        }
                    }
                },
                "themes": { name: "proton" }
            }
            //,
            //"checkbox": { "whole_node": true },
            //"plugins": ["checkbox"]
        })
        .bind("ready.jstree", function (e, data) {
            var placeHolder = folder.DetailsRowRef.find("#tree-placeholder-pbs-" + folder.Id);
            var treeRow = folder.DetailsRowRef.find("#tree-row-pbs-" + folder.Id);
            placeHolder.fadeOut("fast", function () {
                treeRow.show();
            });
        });

        this.DetailsRowRef.find("#btn-tree-selectall-pbs-" + this.Id).click(function () {
            //folder.TreeRef.jstree("check_all");
            folder.TreeRef.jstree("select_all");
            return false;
        });

        this.DetailsRowRef.find("#btn-tree-deselectall-pbs-" + this.Id).click(function () {
            //folder.TreeRef.jstree("uncheck_all");
            folder.TreeRef.jstree("deselect_all");
            return false;
        });

        this.DetailsRowRef.find("#btn-tree-removeselected-pbs-" + this.Id).click(function () {
            //var nodes = folder.TreeRef.jstree("get_checked");
            //folder.TreeRef.jstree("delete_node", nodes);
            var nodes = folder.TreeRef.jstree("get_selected");
            folder.TreeRef.jstree("delete_node", nodes);
            // todo
            //folder.TreeData = folder.TreeRef.jstree("get_json");
            return false;
        });
    }

    function _initTree() {
        var folder = this;
        if (!this.TreeData) {
            $.ajax({
                url: _serviceUrl + folder.Database + "/" + folder.Id + "/" + folder.Type + "/tree",
                headers: { "dmsServer": folder.Server, "dmsUsername": _dmsUsername, "dmsPassword": _dmsPassword },
                type: "get",
                dataType: "json",
                cache: false,
                success: function (treeData) {
                    folder.TreeData = treeData;
                    _renderTree.call(folder);
                }
            });
        } else {
            _renderTree.call(folder);
        }
    }

    // *** public methods
    WorkSiteFolder.prototype.Insert = function () {
        var hidden = $("#main").find("#hdn-objectid-pbs-" + this.Id);
        if (!hidden.length) {
            var folder = this;

            var placeHolder = $("#folder-placeholder").clone();
            placeHolder.find("[id='folder-placeholder-0']").each(function () {
                this.id = this.id.replace(0, folder.Id);
            });

            $("#main").append(placeHolder.html());
            $.ajax({
                // todo: remove Type from here once the core library is updated
                url: _serviceUrl + folder.Database + "/" + folder.Id + "/" + folder.Type + "/summary",
                headers: { "dmsServer": folder.Server, "dmsUsername": _dmsUsername, "dmsPassword": _dmsPassword },
                async: true,
                type: "get",
                dataType: "json",
                success: function (summary) {
                    folder.Name = summary.name;
                    folder.Type = summary.type;
                    folder.SubFolderCount = summary.subfolders;
                    folder.DocumentCount = summary.documents;
                    _databind.call(folder);
                    var placeHolderRef = $("#folder-placeholder-" + folder.Id);
                    placeHolderRef.fadeOut("fast", function () {
                        placeHolderRef.replaceWith(folder.Template.html());
                    })
                },
                error: function () {
                    var placeHolderRef = $("#folder-placeholder-" + folder.Id);
                    placeHolderRef.find("div.panel").replaceWith('<div class="alert alert-danger">An error occurred.</div>');
                }
            });
        }
    }

    WorkSiteFolder.prototype.ShowDetails = function () {
        var hidden = $("#main").find("#hdn-objectid-pbs-" + this.Id);
        this.SummaryRowRef = hidden.parents("div.well").find("div:nth-child(1)");
        this.ButtonRowRef = hidden.parents("div.well").find("div:nth-child(2)");
        this.DetailsRowRef = hidden.parents("div.well").find("div:nth-child(3)");
        this.TreeRef = this.DetailsRowRef.find("#tree-pbs-" + this.Id);
        this.GridRef = this.DetailsRowRef.find("#grid-pbs-" + this.Id);

        // todo: lazy loading
        if (this.TreeRef.is(":empty")) {
            _initTree.call(this);
        }
        this.DetailsRowRef.slideDown("fast");
        var button = this.ButtonRowRef.find("#btn-showdetails-pbs-" + this.Id);
        button.text("Hide Details");
        button.attr("onClick", "FolderManager.HideDetails(this.id.replace('btn-showdetails-pbs-', '')); return false;");
    }

    WorkSiteFolder.prototype.HideDetails = function () {
        this.DetailsRowRef.slideUp("fast");
        var button = this.ButtonRowRef.find("#btn-showdetails-pbs-" + this.Id);
        button.text("Show Details");
        button.attr("onClick", "FolderManager.ShowDetails(this.id.replace('btn-showdetails-pbs-', '')); return false;");
    }

    WorkSiteFolder.prototype.Remove = function () {
        var panel = $("#main").find("#hdn-objectid-pbs-" + this.Id).closest("div.container").parent();
        panel.fadeOut("fast", function () {
            panel.remove();
        });
        // todo: save state

    }

    return WorkSiteFolder;
})();

var FolderManager = function () {
    var _rootFolders = [];

    var _init = function (folders) {
        $.each(folders, function (i, e) {
            var tokens = e.split("!");
            var server = tokens[2].split(":")[1];
            var database = tokens[3].split(":")[1];
            var type = tokens[4].split(":")[0].toLowerCase();
            var id = 0;

            if ("page" === type) {
                id = tokens[4].split(":")[1];
                type = "Workspace";
            }
            else if ("tab" === type) {
                id = tokens[4].split(":")[1];
                type = "Tab";
            }
            else //if ("folder" === type)
            {
                id = tokens[4].split(":")[1].split(",")[1];
                type = "Folder";
            }
            _rootFolders[id] = new WorkSiteFolder(id, null, server, database, type);
        });
    }

    var _insert = function () {
        for (var folderId in _rootFolders) {
            var folder = _rootFolders[folderId];
            folder.Insert();
        }
    }

    var _showDetails = function (folderId) {
        _rootFolders[folderId].ShowDetails();
    }

    var _hideDetails = function (folderId) {
        _rootFolders[folderId].HideDetails();
    }

    return {
        Init: function (folders) {
            _init(folders);
        },

        Insert: function () {
            _insert();
        },

        ShowDetails: function (folderId) {
            _showDetails(folderId);
        },

        HideDetails: function (folderId) {
            _hideDetails(folderId);
        },

        Remove: function (folderId) {
            _rootFolders[folderId].Remove();
            delete _rootFolders[folderId];
        }
    }
}();