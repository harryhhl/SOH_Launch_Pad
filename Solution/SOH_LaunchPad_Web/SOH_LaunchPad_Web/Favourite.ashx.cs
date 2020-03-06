using Helper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Hosting;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for Favourite
    /// </summary>
    public class Favourite : IHttpHandler
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

                var action = HttpUtility.ParseQueryString(input).Get("Action");
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var username = HttpUtility.ParseQueryString(input).Get("User");

                try
                {
                    if (action == "toggle")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_ToggleFavor", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    else if(action == "updacess")
                    {
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        paras.Add(new SqlParameter("@SystemFuncID", sysfuncid));
                        SqlHelper.ExecuteNonQuery(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_UpdateFuncAccess", paras.ToArray());

                        context.Response.ContentType = "application/json";
                        context.Response.Write("{}");
                    }
                    else if(action == "getall")
                    {
                        FavourandFrequentList list = new FavourandFrequentList();
                        List<SqlParameter> paras = new List<SqlParameter>();
                        paras.Add(new SqlParameter("@Username", username));
                        DataSet rcd = SqlHelper.ExecuteDataset(SqlHelper.GetConnection("SOHDB"), CommandType.StoredProcedure, "p_GetFavourites", paras.ToArray());

                        for (int r = 0; r < rcd.Tables[0].Rows.Count; r++)
                        {
                            var row = rcd.Tables[0].Rows[r];
                            string funcId = row["FunctionID"].ToString();
                            list.FavorList.Add(funcId);
                        }

                        for (int r = 0; r < rcd.Tables[1].Rows.Count; r++)
                        {
                            var row = rcd.Tables[1].Rows[r];
                            string funcId = row["FunctionID"].ToString();
                            list.FrequentList.Add(funcId);
                        }

                        context.Response.ContentType = "application/json";
                        context.Response.Write(JsonConvert.SerializeObject(list));
                    }
                    else
                    {
                        context.Response.StatusCode = 400;
                        context.Response.StatusDescription = "No Action is defined";
                    }
                }
                catch(Exception ex)
                {
                    context.Response.StatusCode = 400;
                    context.Response.StatusDescription = ex.Message;
                }
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
        }

        public class FavourandFrequentList
        {
            public List<string> FavorList;
            public List<string> FrequentList;

            public FavourandFrequentList()
            {
                FavorList = new List<string>();
                FrequentList = new List<string>();
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