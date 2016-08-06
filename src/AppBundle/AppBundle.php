<?php

namespace AppBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;
use AppBundle\DependencyInjection\Compiler\TransformLoaderPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class AppBundle extends Bundle
{
    /**
     * {@inheritdoc}
     *
     * @param  ContainerBuilder $container
     *
     * @return void
     */
    public function build(ContainerBuilder $container)
    {
        parent::build($container);
        $container->addCompilerPass(new TransformLoaderPass());
    }
}
