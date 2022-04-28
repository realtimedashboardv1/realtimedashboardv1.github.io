var method = 'Report.Run';

        var params = {
            "reportDescription": {
                "source": "realtime",
                "reportSuiteID": config.reportSuite,
                "metrics": [
                    { "id": "pageviews" }
                ], "elements": [
                    { "id": "prop1" },
                ],
                "dateGranularity": "minute:1",
                "dateFrom": "-15 minutes"
            }
        };

        

        //var trendGraph = new AnimatedTrendGraph("#trendGraph", { width: 660, height: 200, delay: 60000 });
        var donutChart = new DonutChart("#donutChart", { width: 300, height: 450 });
        var basicTable = new BasicTable("#data-table", { columns: ["Page Name", "Page Views"] });

        // number counter
        $(document).on("realtime-data-received", function (event, report) {
            // grab the total for this time period
            var total = report.totals[0];
            console.log(report);

            // add a comma every thousand numbers (i.e. 1000 => 1,000)
            var commaStep = $.animateNumber.numberStepFactories.separator(',');

            //Animate the number
            $('#total').animateNumber({
                number: total,
                numberStep: commaStep
            }, 500);
        });

        // // trends graph
        // $(document).on("realtime-data-received", function (event, report) {
        //     // pull the minute totals for each minute
        //     // formatted data is [100, 200, 300, ...] (newest data last)
        //     data = report.data.map(function (minute) {
        //         return parseInt(minute.breakdownTotal[0]);
        //     });

        //     //trendGraph.redrawGraph(data);
        // });

        // donut chart and data-table
        $(document).on("realtime-data-received", function (event, report) {
            // we only update this chart once a minute
            donutChart.redrawChart(report.pageTotals);
            basicTable.update(report.pageTotals);
        });

        // call the realtime api
        var makeRealTimeRequest = function () {
            MarketingCloud.makeRequest(config.username, config.secret, method, params, config.endpoint, function (response) {
                if (response.status == 200) {
                    var report = response.responseJSON.report;
                    setPageTotals(report);
                    if (report.pageTotals.length == 0) {
                        $('#total').html('<span class="no-data">No Data</span>');
                        document.getElementById('donutChart').style.display = "none";
                        document.getElementById('ranked').style.display = "none";
                    } else {
                        var event = jQuery.Event("realtime-data-received");
                        $(document).trigger(event, report);
                        document.getElementById('donutChart').style.display = "block";
                        document.getElementById('ranked').style.display = "block";
                        // console.log('api-response-received');
                    }
                }
            });
        };

        var setPageTotals = function (report) {
            // return the total count for each page
            // formatted data is [["PageName", 123], ["PageName 2", 456]]
            var totals = [];
            $(report.data).each(function (i, minute) {
                $(minute.breakdown).each(function (j, page) {
                    total = parseInt(page.counts[0]) + (totals[j] ? totals[j][1] : 0);
                    totals[j] = [page.name, total];
                });
            });

            report.pageTotals = totals;
        }

        // code to run when the HTML is fully loaded
        $(document).ready(function () {
            // set the dashboard to make a report request every 5 seconds
            var time = 5000; // milliseconds
            var interval = setInterval(makeRealTimeRequest, time);
            // request the initial report
            makeRealTimeRequest();

            document.getElementById('time').addEventListener('change', function(obj) {
                params.reportDescription.dateFrom = this.value;
                makeRealTimeRequest();
            });
        });