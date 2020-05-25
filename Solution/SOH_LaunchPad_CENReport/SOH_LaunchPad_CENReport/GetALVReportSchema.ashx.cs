using System;
using System.Linq;
using System.Collections.Generic;
using System.Web;
using Newtonsoft.Json;
using System.IO;
using System.Data;
using Helper;


namespace SOH_LaunchPad_CENReport
{
    /// <summary>
    /// Summary description for GetALVReportSchema
    /// </summary>
    public class GetALVReportSchema : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var reportname = HttpUtility.ParseQueryString(input).Get("Report");
                var qid = HttpUtility.ParseQueryString(input).Get("QID");

                try
                {
                    KendoGridConfig config = GetConfigFromReportDB(reportname, qid);

                    RequestResult ret = new RequestResult(RequestResult.ResultStatus.Success);
                    ret.Data = JsonConvert.SerializeObject(config);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = new RequestResult(RequestResult.ResultStatus.Failure);
                    result.Errmsg = ex.Message;
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public static KendoGridConfig GetConfigFromReportDB(string reportname, string qid)
        {
            DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                             $@"SELECT a.COLUMN_NAME, 
                                       a.DATA_TYPE, 
                                       a.DATA_LENGTH, 
                                       isnull(b.EXTENDEDPROPERTYVALUE, '') AS COLUMN_TITLE 
                                FROM   (SELECT COLUMN_NAME, 
                                               DATA_TYPE, 
                                               Isnull(CHARACTER_MAXIMUM_LENGTH, 0) AS DATA_LENGTH, 
                                               ORDINAL_POSITION 
                                        FROM   information_schema.columns 
                                        WHERE  TABLE_NAME = '{reportname}' 
                                               AND COLUMN_NAME <> 'SelectionID' 
                                               AND COLUMN_NAME <> 'CreatedOn') a 
                                       LEFT JOIN 
                                       (SELECT clmns.NAME AS ColumnName, 
                                                Cast(p.VALUE AS SQL_VARIANT) AS ExtendedPropertyValue 
                                        FROM   sys.tables AS tbl 
                                                INNER JOIN sys.all_columns AS clmns 
                                                        ON clmns.OBJECT_ID = tbl.OBJECT_ID 
                                                INNER JOIN sys.extended_properties AS p 
                                                        ON p.MAJOR_ID = tbl.OBJECT_ID 
                                                        AND p.MINOR_ID = clmns.COLUMN_ID 
                                                        AND p.CLASS = 1 
                                        WHERE  tbl.NAME = '{reportname}') b 
                                    ON a.COLUMN_NAME = b.COLUMNNAME 
                                 ORDER  BY ORDINAL_POSITION ASC ");

            KendoGridSchemaSetting schema = new KendoGridSchemaSetting();
            List<KendoGridColumnSetting> settings = new List<KendoGridColumnSetting>();

            var colLengthDS = GetColumnMaxDataLength(reportname, qid);

            for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
            {
                var row = rcd.Tables[0].Rows[r];

                string columnname = row["COLUMN_NAME"].ToString();
                string datatype = row["DATA_TYPE"].ToString();
                int datalength = (int)row["DATA_LENGTH"];
                string title = row["COLUMN_TITLE"].ToString().Trim();

                schema.Add(columnname, datatype);

                datalength = colLengthDS == null ? datalength : colLengthDS[columnname];

                settings.Add(KendoGridColumnSetting.Create(columnname, title, datatype, datalength));
            }

            KendoGridConfig config = new KendoGridConfig();
            config.SchemaSetting = schema.GetSchemaString();
            config.ColumnSetting = JsonConvert.SerializeObject(settings);

            return config;
        }

        private static Dictionary<string, int> GetColumnMaxDataLength(string reportname, string qid)
        {
            Dictionary<string, int> list = new Dictionary<string, int>();

            try
            {
                DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("ReportDB"), CommandType.Text,
                     $@"
                        declare @results table
                        (
                        ID varchar(36),
                        ColumnName varchar(250),
                        Longest varchar(250),
                        SQLText varchar(250)
                        )

                        INSERT INTO @results(ID,ColumnName,Longest,SQLText)
                        SELECT 
                            NEWID(),
                            COLUMN_NAME,
                            'NA',
                            'SELECT Max(Len(' + COLUMN_NAME + ')) FROM {reportname} where SelectionID=''{qid}'''
                        FROM 
                        (SELECT COLUMN_NAME, 
                                    DATA_TYPE, 
                                    Isnull(CHARACTER_MAXIMUM_LENGTH, 0) AS DATA_LENGTH, 
                                    ORDINAL_POSITION 
                            FROM   information_schema.columns 
                            WHERE  TABLE_NAME = '{reportname}' 
                                    AND COLUMN_NAME <> 'SelectionID' 
                                    AND COLUMN_NAME <> 'CreatedOn' )a 

                        ORDER  BY ORDINAL_POSITION ASC  



                        DECLARE @id varchar(36)
                        DECLARE @sql varchar(200)
                        declare @receiver table(theCount int)

                        DECLARE length_cursor CURSOR
                            FOR SELECT ID, SQLText FROM @results 
                        OPEN length_cursor
                        FETCH NEXT FROM length_cursor
                        INTO @id, @sql
                        WHILE @@FETCH_STATUS = 0
                        BEGIN
                            INSERT INTO @receiver (theCount)
                            exec(@sql)

                            UPDATE @results
                            SET Longest = (SELECT theCount FROM @receiver)
                            WHERE ID = @id

                            DELETE FROM @receiver

                            FETCH NEXT FROM length_cursor
                            INTO @id, @sql
                        END
                        CLOSE length_cursor
                        DEALLOCATE length_cursor


                        SELECT 
                            ColumnName, 
                            Longest 
                        FROM 
                            @results");


                for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                {
                    var row = rcd.Tables[0].Rows[r];

                    string columnname = row["ColumnName"].ToString();
                    string datalengstr = row["Longest"].ToString();

                    int datalength = 0;
                    int.TryParse(datalengstr, out datalength);

                    list.Add(columnname, datalength);
                }

                return list;

            }
            catch (Exception)
            {
                return null;
            }
        }

        public class KendoGridConfig
        {
            public string SchemaSetting;
            public string ColumnSetting;
        }

        public class KendoGridSchemaSetting
        {
            private List<string> SchemaString = new List<string>();

            public void Add(string columname, string datatype)
            {
                SchemaString.Add(string.Format("\"{0}\": {{ \"type\": \"{1}\" }}", columname, GetKendoType(datatype)));
            }

            public string GetSchemaString()
            {
                string delimiter = ",";
                return "{" + SchemaString.Aggregate((i, j) => i + delimiter + j) + "}";
            }

            public static string GetKendoType(string datatype)
            {
                if (datatype.Contains("date"))
                    return "date";
                else if (datatype.Contains("int") || datatype.Contains("decimal"))
                    return "number";
                else
                    return "string";
            }
        }

        public class KendoGridColumnSetting
        {
            public string field { get; set; }
            public string title { get; set; }
            public string width { get; set; }
            public string template { get; set; }

            public static KendoGridColumnSetting Create(string columname, string title, string datatype, int datalength)
            {
                KendoGridColumnSetting s = new KendoGridColumnSetting();

                s.field = columname;
                s.title = title.Length > 0 ? title : columname;

                if (KendoGridSchemaSetting.GetKendoType(datatype) == "date")
                {
                    int len = 90;

                    int title_len = title.Trim().Length * 8 + 40;
                    len = Math.Max(len, title_len);
                    s.width = $"{len}px";


                    s.template = $"#= {columname}==null? '': kendo.toString({columname}, \"yyyy-MM-dd\" ) #";
                    //s.template = $"# var x = new Date('1901-01-01'); var y = new Date({columname});if (y > x) {{;# #=kendo.toString({columname}, \"yyyy-MM-dd\" ) # #}}#";
                }
                else if(KendoGridSchemaSetting.GetKendoType(datatype) == "number")
                {
                    int len = 80;

                    int title_len = title.Trim().Length * 8 + 40;
                    len = Math.Max(len, title_len);
                    s.width = $"{len}px";

                    s.template = $"#={columname}#";
                }
                else
                {
                    int len = 50;
                    if (datalength < 0)
                        len = 140;
                    else
                        len = len + Math.Max(datalength * 8, 40);

                    int title_len = title.Trim().Length * 8 + 40;
                    len = Math.Max(len, title_len);
                    s.width = $"{len}px";

                    s.template = $"#={columname}#";
                }

                return s;
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}