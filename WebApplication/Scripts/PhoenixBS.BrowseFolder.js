$(function () {
    // ######
    // todo: remove this
    localStorage.clear();
    // ######

    // todo: get this working
    //var $loading = $('#loading').hide();
    //$(document)
    //    .ajaxStart(function () {
    //        $loading.show();
    //    })
    //    .ajaxStop(function () {
    //        $loading.hide();
    //    });

    WorkSiteBrowser.Init();

    $("#browse").click(function () {
        var folders = WorkSiteBrowser.SelectFolders();

        if (folders) {
            if (0 === $("#folder-template").length) {
                var path = '//' + location.host + location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/FolderTemplate.html";

                $.ajax({
                    async: false,
                    type: 'GET',
                    url: path,
                    success: function (data) {
                        $(data).appendTo("body");
                    }
                });
            }
            WorkSiteFolders.Insert(folders);
        }
    });
});

//var WorkSiteFolder = function () {
//    var _id = 0;

//    return {
//        Init: function (options) {
//            _insert(folders);
//        },

//        HideDetails: function (id) {
//            _hideDetails(id);
//        }
//    }
//}();

var WorkSiteFolders = function () {
    /* todo: refactor all of this so it's sort of oo -
    [
        folder: {
            prjId : "",
            name : "",
            type : "",
            subfolders : [
                subfolder : {
                    {},
                    {}
                }
            ]
        }
    ]
    */
    var _loadSummary = function (index) {
        var path = "http://localhost/TestService/api/folders/5/summary";

        $.ajax({
            async: false,
            type: "get",
            url: path,
            dataType: "json",
            success: function (summary) {
                $("#folder-template").find("#id-pbs-" + index).text(summary.prj_id);
                $("#folder-template").find("#name-pbs-" + index).text(summary.name);
                $("#folder-template").find("#type-pbs-" + index).text(summary.type);
                $("#folder-template").find("#subfolders-pbs-" + index).text(summary.subfolders);
                $("#folder-template").find("#documents-pbs-" + index).text(summary.documents);
            }
        });
    }

    var _showGrid = function (gridData, grid, folderId, nodeId, detailsRow) {
        var gridPanel = grid.closest("div.panel");

        dt = grid.DataTable({
            data: gridData,
            columns:
            [
                { "data": "docnum" },
                { "data": "description" }
            ],
            initComplete: function () {
                gridPanel.slideDown("fast");
            }
        });

        var lastIdx = null;
        grid.on("mouseover", "td", function () {
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
        });

        detailsRow.find("#btn-grid-selectall-pbs-" + folderId).click(function () {
            grid.find("tr").each(function () {
                $(this).addClass("active");
            });
            return false;
        });

        detailsRow.find("#btn-grid-deselectall-pbs-" + folderId).click(function () {
            grid.find("tr").each(function () {
                $(this).removeClass("active");
            });
            return false;
        });

        detailsRow.find("#btn-grid-removeselected-pbs-" + folderId).click(function () {
            dt.row(".active").remove().draw(false);
            localStorage["node-" + nodeId] = JSON.stringify(dt.data());
            return false;
        });
    }

    var _renderGrid = function (gridData, grid, folderId, nodeId, detailsRow) {
        var dt;
        var gridPanel = grid.closest("div.panel");

        if ($.fn.dataTable.isDataTable(grid)) {
            gridPanel.slideUp("fast", function () {
                dt = grid.DataTable();
                dt.destroy();
                _showGrid(gridData, grid, folderId, nodeId, detailsRow);
            });
        } else {
            _showGrid(gridData, grid, folderId, nodeId, detailsRow);
        }
    }

    var _loadGrid = function (grid, nodeId, folderId, detailsRow) {
        // todo: lazy loading - http://datatables.net/examples/server_side/pipeline.html
        var nodeStorageKey = "node-" + nodeId;

        if ("undefined" === typeof localStorage[nodeStorageKey]) {
            $.ajax({
                url: "http://localhost/TestService/api/folders/" + nodeId + "/documents",
                type: "get",
                dataType: "json",
                cache: false,
                success: function (gridData) {
                    _renderGrid(gridData, grid, folderId, nodeId, detailsRow);
                }
            });
        } else {
            _renderGrid($.parseJSON(localStorage[nodeStorageKey]), grid, folderId, nodeId, detailsRow);
        }
    }

    var _renderTree = function (treeData, tree, folderId, treeId, detailsRow) {
        var grid = detailsRow.find("#grid-pbs-" + folderId);

        tree.on("activate_node.jstree", function (e, data) {
            var nodeId = data.node.id;
            _loadGrid(grid, nodeId, folderId, detailsRow)
        }).jstree({
            "core": {
                "check_callback" : true,
                "data": treeData,
                "themes": { name : "proton" }
            },
            "plugins" : [ "checkbox" ]
        });

        detailsRow.find("#btn-tree-selectall-pbs-" + folderId).click(function () {
            tree.jstree("check_all");
            return false;
        });

        detailsRow.find("#btn-tree-deselectall-pbs-" + folderId).click(function () {
            tree.jstree("uncheck_all");
            return false;
        });

        detailsRow.find("#btn-tree-removeselected-pbs-" + folderId).click(function () {
            var nodes = tree.jstree("get_checked");
            tree.jstree("delete_node", nodes);
            localStorage["tree-" + treeId] = JSON.stringify(tree.jstree("get_json"));
            return false;
        });
    }

    var _loadTree = function (tree, treeId, folderId, detailsRow) {
        var treeStorageKey = "tree-" + treeId;

        if ("undefined" === typeof localStorage[treeStorageKey]) {
            $.ajax({
                url: "http://localhost/TestService/api/folders/" + treeId,
                type: "get",
                dataType: "json",
                cache: false,
                success: function (treeData) {
                    _renderTree(treeData, tree, folderId, treeId, detailsRow);
                }
            });

        } else {
            _renderTree($.parseJSON(localStorage[treeStorageKey]), tree, folderId, treeId, detailsRow);
        }
    }

    var _showDetails = function (id) {
        // folderId > treeId > nodeId
        var folderId = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + folderId);
        var summaryRow = hidden.parents("div.well").find("div:nth-child(1)");
        var buttonRow = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsRow = hidden.parents("div.well").find("div:nth-child(3)");
        var treeId = summaryRow.find("#id-pbs-" + folderId).text();
        var tree = detailsRow.find("#tree-pbs-" + folderId);

        // todo: lazy loading
        // todo: load to/from local storage
        if (tree.is(":empty")) {
            _loadTree(tree, treeId, folderId, detailsRow);
        }
        detailsRow.slideDown("fast");
        var button = buttonRow.find("#btn-showdetails-pbs-" + folderId);
        button.text("Hide Details");
        button.attr("onClick", "WorkSiteFolders.HideDetails(this.id); return false;");
    }

    var _hideDetails = function (id) {
        var index = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + index);
        var buttonPanel = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsPanel = hidden.parents("div.well").find("div:nth-child(3)");
        detailsPanel.slideUp("fast");
        var button = buttonPanel.find("#btn-showdetails-pbs-" + index);
        button.text("Show Details");
        button.attr("onClick", "WorkSiteFolders.ShowDetails(this.id); return false;");
    }

    var _insert = function (folders) {
        $.each(folders, function (i, e) {
            $("#main").append(function () {
                // todo: make this use id's instead of a count
                var indexOld = 0;
                var exists = false;
                var currentFolders = $("#main").find("input[id^='hdn-objectid-pbs-']");
                currentFolders.each(function () {
                    var id = this.id.replace("hdn-objectid-pbs-", "");
                    indexOld = Math.max(indexOld, parseInt(id));
                    if (e === this.value) exists = true;
                });

                if (!exists) {
                    var index = indexOld + 1;
                    var template = $("#folder-template");
                    template.find("[id$='pbs-" + indexOld + "']").each(function () {
                        this.id = this.id.replace(indexOld, index);
                    });
                    _loadSummary(index);

                    template.find("#hdn-objectid-pbs-" + index).val(e);
                    template.find("#btn-showdetails-pbs-" + index).attr("onclick", "WorkSiteFolders.ShowDetails(this.id); return false;");
                    template.find("#btn-remove-pbs-" + index).attr("onclick", "WorkSiteFolders.Remove(this.id); return false;");

                    return template.html();
                }
            });
        });
    }

    var _remove = function (id) {
        var index = id.replace("btn-remove-pbs-", "");
        var panel = $("#main").find("#hdn-objectid-pbs-" + index).closest("div.container");
        panel.fadeOut("fast", function () {
            panel.remove();
        });
        // todo: save state
    }

    return {
        Insert: function (folders) {
            _insert(folders);
        },

        Remove: function (id) {
            _remove(id);
        },

        ShowDetails: function (id) {
            _showDetails(id);
        },

        HideDetails: function (id) {
            _hideDetails(id);
        }
    }
}();