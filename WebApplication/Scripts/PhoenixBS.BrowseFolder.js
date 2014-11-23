$(function () {
    WorkSiteBrowser.Init();

    $("#browse").click(function () {
        var folders = WorkSiteBrowser.SelectFolders();

        if (folders) {
            FolderManager.Init(folders)
            FolderManager.Render();
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
    function _getTemplate() {
        this.Template.find("#id-pbs-0").text(this.Id);
        this.Template.find("#name-pbs-0").text(this.Name);
        this.Template.find("#type-pbs-0").text(this.Type);
        this.Template.find("#subfolders-pbs-0").text(this.SubFolderCount);
        this.Template.find("#documents-pbs-0").text(this.DocumentCount);
        this.Template.find("#hdn-objectid-pbs-0").val(this.Id);
        this.Template.find("#btn-showdetails-pbs-0").attr("onclick", "FolderManager.ShowDetails(this.id.replace('btn-showdetails-pbs-', '')); return false;");
        this.Template.find("#btn-remove-pbs-0").attr("onclick", "FolderManager.Remove(this.id.replace('btn-remove-pbs-', '')); return false;");
        var folder = this;
        this.Template.find("[id$='pbs-0']").each(function () {
            this.id = this.id.replace(0, folder.Id);
        });
    }

    function _showGrid() {
        var folder = this;
        var gridPanel = this.GridRef.closest("div.panel");

        var dt = this.GridRef.DataTable({
            data: this.ActiveNodeRef,
            columns:
            [
                { "data": "docnum" },
                { "data": "description" }
            ],
            initComplete: function () {
                gridPanel.slideDown("fast", function () {
                    var lastIdx = null;
                    folder.GridRef.on("mouseover", "td", function () {
                        var colIdx = dt.cell(this).index().column;

                        if (colIdx !== lastIdx) {
                            $(dt.cells().nodes()).removeClass("highlight");
                            $(dt.column(colIdx).nodes()).addClass("highlight");
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
                        folder.ActiveNodeRef = dt.data();
                        return false;
                    });
                });
            }
        });
    }

    function _renderGrid() {
        var folder = this;
        var gridPanel = this.GridRef.closest("div.panel");

        if ($.fn.dataTable.isDataTable(this.GridRef)) {
            gridPanel.slideUp("fast", function () {
                folder.GridRef.DataTable().destroy();
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
                _showGrid.call(folder);
            });
        } else {
            _showGrid.call(folder);
        }
    }
    
    function _initGrid(nodeId) {
        var folder = this;
        this.ActiveNodeRef = this.TreeData.filter(function (item) {
            return (item.id === nodeId && item.docsLoaded === 1);
        })[0];
        if (!this.ActiveNodeRef) {
            $.ajax({
                url: _serviceUrl + folder.Database + "/" + nodeId + "/documents",
                headers: { "dmsServer" : folder.Server, "dmsUsername" : _dmsUsername, "dmsPassword" : _dmsPassword },
                type: "get",
                dataType: "json",
                cache: false,
                success: function (gridData) {
                    folder.ActiveNodeRef = gridData;
                    _renderGrid.call(folder);
                }
            });
        } else {
            _renderGrid.call(folder);
        }
    }

    function _renderTree() {
        var folder = this;
        this.TreeRef.on("activate_node.jstree", function (e, data) {
            var nodeId = data.node.id;
            _initGrid.call(folder, nodeId)
        }).jstree({
            "core": {
                "check_callback": true,
                "data": this.TreeData,
                "themes": { name: "proton" }
            },
            "plugins": ["checkbox"]
        });

        this.DetailsRowRef.find("#btn-tree-selectall-pbs-" + this.Id).click(function () {
            folder.TreeRef.jstree("check_all");
            return false;
        });

        this.DetailsRowRef.find("#btn-tree-deselectall-pbs-" + this.Id).click(function () {
            folder.TreeRef.jstree("uncheck_all");
            return false;
        });

        this.DetailsRowRef.find("#btn-tree-removeselected-pbs-" + this.Id).click(function () {
            var nodes = folder.TreeRef.jstree("get_checked");
            folder.TreeRef.jstree("delete_node", nodes);
            folder.TreeData = folder.TreeRef.jstree("get_json");
            return false;
        });
    }

    function _initTree() {
        var folder = this;
        if (!this.TreeData) {
            $.ajax({
                url: _serviceUrl + folder.Database + "/" + folder.Id,
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
    WorkSiteFolder.prototype.GetTemplate = function () {
        var folder = this;
        $.ajax({
            // todo: remove Type from here once the core library is updated
            url: _serviceUrl + folder.Database + "/" + folder.Id + "/" + folder.Type + "/summary",
            headers: { "dmsServer": folder.Server, "dmsUsername": _dmsUsername, "dmsPassword": _dmsPassword },
            async: false,
            type: "get",
            dataType: "json",
            success: function (summary) {
                folder.Name = summary.name;
                folder.Type = summary.type;
                folder.SubFolderCount = summary.subfolders;
                folder.DocumentCount = summary.documents;
                _getTemplate.call(folder);
            }
        });
        return this.Template.html();
    }

    WorkSiteFolder.prototype.ShowDetails = function()
    {
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

    WorkSiteFolder.prototype.Remove = function ()
    {
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
            // workspace[2] = session:xxx
            // workspace[3] = database:xxx
            // workspace[4] = page:xxx
            // folder[2] = session:xxx
            // folder[3] = database:xxx
            // folder[4] = folder:xxx,yyy
            var tokens = e.split("!");
            var server = tokens[2].split(":")[1];
            var database = tokens[3].split(":")[1];
            var type = tokens[4].split(":")[0];
            var id = 0;

            if ("page" === type) {
                id = tokens[4].split(":")[1];
            }
            else if ("folder" === type) {
                id = tokens[4].split(":")[1].split(",")[1];
            }
            _rootFolders[id] = new WorkSiteFolder(id, null, server, database, type);
        });
    }

    var _render = function () {
        for (var folderId in _rootFolders) {
            var folder = _rootFolders[folderId];
            var exists = false;
            var folders = $("#main").find("input[id^='hdn-objectid-pbs-']");
            folders.each(function () {
                if (folderId === this.value) exists = true;
            });
            if (!exists) $("#main").append(folder.GetTemplate());
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

        Render: function () {
            _render();
        },

        ShowDetails: function (folderId) {
            _showDetails(folderId);
        },

        HideDetails: function(folderId) {
            _hideDetails(folderId);
        },

        Remove: function (folderId) {
            _rootFolders[folderId].Remove();
        }
    }
}();