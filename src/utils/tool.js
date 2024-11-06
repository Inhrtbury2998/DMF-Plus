//用于在编写代码时起辅助功能的方法，但不在实际运行中起作用，调用时在test下创建html文件和调用
function a(string){
    try{
        let b =[];
        string.split('\n').forEach(element => {
            b.push(element.split(','));
        });
        console.log(b);
        return b;
    }catch(error){
        console.log(error);
        return error;
    }
}