using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace pim360_import
{
    public class Activity
    {
        public string _id { get; set; }
        public string Hdl { get; set; }
        public dynamic[] Attachments { get; set; }
        public string Completed { get; set; }
        public string DatasetReference { get; set; }
        public string Name { get; set; }
        public string Started { get; set; }
        public int TaskCnt { get; set; }
        public int TaskNo { get; set; }
        public string Type { get; set; }
        public string Status { get; set; }
        public ActivityTask[] Tasks { get; set; }
    }

    public class ActivityTask
    {
        public string Hdl { get; set; }
        public string ActHdl { get; set; }
        public string Name { get; set; }
        public string Status { get; set; }
        public int TotalRowCnt { get; set; }
        public int CurrRow { get; set; }
        public int ErrCnt { get; set; }
        public Attachments[] Attachments { get; set; }
        public string Started { get; set; }
        public string Completed { get; set; }
    }

    public class Attachments
    {
        public string Hdl { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
    }
}
