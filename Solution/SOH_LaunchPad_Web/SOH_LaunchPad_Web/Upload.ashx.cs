using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using System.Web.SessionState;

namespace SOH_LaunchPad_Web
{
    /// <summary>
    /// Summary description for Upload
    /// </summary>
    public class Upload : IHttpHandler, IRequiresSessionState
    {

        public void ProcessRequest(HttpContext context)
        {
            try
            {
                HttpFileCollection files = context.Request.Files;
                HttpPostedFile file = files[0];
                int filelength = file.ContentLength;
                byte[] fdata = new byte[filelength];
                file.InputStream.Read(fdata, 0, filelength);

                ImportFileData ifd = new ImportFileData();
                ifd.FileDataBase64 = Convert.ToBase64String(fdata);
                ifd.FileName = file.FileName;

                var iden = context.Request.Form["id"].ToString();

                HttpContext.Current.Session["FileUpload_" + iden] = JsonConvert.SerializeObject(ifd);

                context.Response.AddHeader("Content-type", "text/plain");
                context.Response.Write("");
            }
            catch (Exception e)
            {
                context.Response.Write("{'error':'" + e.Message + "'}");
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

    public class ImportFileData
    {
        public string FileName;
        public string FileDataBase64;
    }
}