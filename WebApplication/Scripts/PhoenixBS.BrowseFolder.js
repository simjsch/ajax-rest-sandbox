$(function () {
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

var WorkSiteFolders = function () {
    var _loadSummary = function (index) {
        var path = "http://localhost/TestService/api/folders/5/summary";

        $.ajax({
            async: false,
            type: 'GET',
            url: path,
            dataType: 'json',
            success: function (summary) {
                $("#folder-template").find("#id-pbs-" + index).text(summary.prj_id);
                $("#folder-template").find("#name-pbs-" + index).text(summary.name);
                $("#folder-template").find("#type-pbs-" + index).text(summary.type);
                $("#folder-template").find("#subfolders-pbs-" + index).text(summary.subfolders);
                $("#folder-template").find("#documents-pbs-" + index).text(summary.documents);
            }
        });
    }

    var _loadGrid = function (grid, parentFolderId, index, detailsRow) {
        // todo: fix reload on node change - http://datatables.net/manual/tech-notes/3
        // todo: lazy loading - http://datatables.net/examples/server_side/pipeline.html
        // todo: load to/from local storage

        var dt;

        if ($.fn.dataTable.isDataTable(grid)) {
            dt = grid.DataTable();
            // todo: save state
            dt.destroy();
        }
        dt = grid.DataTable({
            ajax: "http://localhost/TestService/api/folders/" + parentFolderId + "/documents",
            columns:
            [
                { "data": "docnum" },
                { "data": "description" }
            ]
        });
        grid.on('click', 'tr', function () {
            $(this).toggleClass('active');
        });

        detailsRow.find("#btn-grid-selectall-pbs-" + index).click(function () {
            grid.find("tr").each(function () {
                $(this).addClass("active");
            });
            return false;
        });

        detailsRow.find("#btn-grid-deselectall-pbs-" + index).click(function () {
            grid.find("tr").each(function () {
                $(this).removeClass("active");
            });
            return false;
        });

        detailsRow.find("#btn-grid-removeselected-pbs-" + index).click(function () {
            dt.row(".active").remove().draw(false);
            return false;
        });
    }

    var _loadTree = function (tree, parentFolderId, index, detailsRow) {
        var grid = detailsRow.find("#grid-pbs-" + index);

        tree.fancytree({
            checkbox: true,
            selectMode: 3,
            source: {
                url: 'http://localhost/TestService/api/folders/' + parentFolderId,
                cache: false
            },
            cookieId: "fancytree-Cb" + index,
            idPrefix: "fancytree-Cb" + index + "-",
            activate: function (event, data) {
                _loadGrid(grid, parentFolderId, index, detailsRow)
            }
        });

        detailsRow.find("#btn-tree-selectall-pbs-" + index).click(function () {
            tree.fancytree("getTree").visit(function (node) {
                node.setSelected(true);
            });
            return false;
        });

        detailsRow.find("#btn-tree-deselectall-pbs-" + index).click(function () {
            tree.fancytree("getTree").visit(function (node) {
                node.setSelected(false);
            });
            return false;
        });

        detailsRow.find("#btn-tree-removeselected-pbs-" + index).click(function () {
            var ftree = tree.fancytree("getTree");
            var nodes = ftree.getSelectedNodes();
            nodes.forEach(function (node) {
                while (node.hasChildren()) {
                    node.getFirstChild().moveTo(node.parent, "child");
                }
                node.remove();
            });
            return false;
        });
    }

    var _showDetails = function (id) {
        var index = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + index);
        var summaryRow = hidden.parents("div.well").find("div:nth-child(1)");
        var buttonRow = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsRow = hidden.parents("div.well").find("div:nth-child(3)");
        var parentFolderId = summaryRow.find("#id-pbs-" + index).text();
        var tree = detailsRow.find("#tree-pbs-" + index);

        // todo: lazy loading
        // todo: load to/from local storage
        if (tree.is(":empty")) {
            _loadTree(tree, parentFolderId, index, detailsRow);
        }
        detailsRow.show();
        var button = buttonRow.find("#btn-showdetails-pbs-" + index);
        button.text("Hide Details");
        button.attr("onClick", "WorkSiteFolders.HideDetails(this.id); return false;");
    }

    var _hideDetails = function (id) {
        var index = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + index);
        var buttonPanel = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsPanel = hidden.parents("div.well").find("div:nth-child(3)");
        detailsPanel.hide();
        var button = buttonPanel.find("#btn-showdetails-pbs-" + index);
        button.text("Show Details");
        button.attr("onClick", "WorkSiteFolders.ShowDetails(this.id); return false;");
    }

    var _insert = function (folders) {
        $.each(folders, function (i, e) {
            $("#main").append(function () {
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
        panel.fadeOut("slow", function () {
            panel.remove();
        });
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